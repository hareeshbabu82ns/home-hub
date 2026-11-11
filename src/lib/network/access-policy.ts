/**
 * Desired access state for a device (Phase 3). Pure functions: the reconciler
 * turns the result into router state, the UI uses it to explain why.
 */

export type AccessReason =
  | { kind: "manual" }
  | { kind: "paused"; until: string }
  | { kind: "schedule"; scheduleId: string; name: string }
  | { kind: "quarantine" }
  | { kind: "quota"; usedMB: number; quotaMB: number };

export interface AccessDecision {
  blocked: boolean;
  reasons: AccessReason[];
  /**
   * A temporary allowance is active until this instant (ISO). The device is
   * not blocked; `suspended` lists the reasons that return when it ends.
   */
  allowedUntil: string | null;
  suspended: AccessReason[];
  /** Why control doesn't apply (router/gateway, WAN side); null if it does. */
  exempt: string | null;
}

export interface AccessDevice {
  id: string;
  role: string;
  isUpstream: boolean;
  isNew: boolean;
  blocked?: boolean | null;
  pausedUntil?: Date | string | null;
  allowedUntil?: Date | string | null;
  dailyQuotaMB?: number | null;
  quotaAction?: string | null;
}

export interface AccessSchedule {
  id: string;
  name: string;
  enabled: boolean;
  days: number[];
  startMinute: number;
  endMinute: number;
  deviceIds: string[];
  manualState?: string | null;
  manualUntil?: Date | string | null;
}

export interface AccessContext {
  schedules: AccessSchedule[];
  quarantineNewDevices: boolean;
  now: Date;
  timeZone: string;
  /** deviceId → estimated bytes since local midnight (for quotas). */
  usageToday?: Record<string, number>;
}

const NOT_BLOCKED: AccessDecision = {
  blocked: false,
  reasons: [],
  exempt: null,
  allowedUntil: null,
  suspended: [],
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function resolveTimeZone(preferred?: string | null): string {
  for (const zone of [preferred, process.env.TZ, "UTC"]) {
    if (!zone) continue;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone });
      return zone;
    } catch {
      // invalid zone name, try the next one
    }
  }
  return "UTC";
}

/** Weekday (0 = Sunday) and minutes after midnight in `timeZone`. */
export function localTime(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return {
    day: WEEKDAYS.indexOf(get("weekday")),
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** The manual start/skip in force at `now`, or null. */
export function scheduleOverride(
  schedule: AccessSchedule,
  now: Date,
): { state: "on" | "off"; until: Date } | null {
  const until = schedule.manualUntil ? new Date(schedule.manualUntil) : null;
  if (!until || until <= now) return null;
  if (schedule.manualState !== "on" && schedule.manualState !== "off") return null;
  return { state: schedule.manualState, until };
}

export function isScheduleActive(schedule: AccessSchedule, now: Date, timeZone: string): boolean {
  if (!schedule.enabled || schedule.startMinute === schedule.endMinute) return false;
  const override = scheduleOverride(schedule, now);
  if (override) return override.state === "on";
  return isInScheduleWindow(schedule, now, timeZone);
}

/** Whether `now` falls in the schedule's own window, ignoring enabled/overrides. */
export function isInScheduleWindow(schedule: AccessSchedule, now: Date, timeZone: string): boolean {
  const { day, minute } = localTime(now, timeZone);
  const { startMinute: start, endMinute: end, days } = schedule;
  if (start < end) {
    return days.includes(day) && minute >= start && minute < end;
  }
  // Crosses midnight: e.g. 22:00–07:00 starting on the listed days.
  const yesterday = (day + 6) % 7;
  return (days.includes(day) && minute >= start) || (days.includes(yesterday) && minute < end);
}

export function decideAccess(device: AccessDevice, context: AccessContext): AccessDecision {
  if (device.role === "INFRASTRUCTURE") {
    return { ...NOT_BLOCKED, exempt: "Router and gateway addresses can't be blocked" };
  }
  if (device.isUpstream) {
    return { ...NOT_BLOCKED, exempt: "WAN-side device: LAN firewall rules don't filter it" };
  }

  const reasons: AccessReason[] = [];
  if (device.blocked) reasons.push({ kind: "manual" });

  const pausedUntil = device.pausedUntil ? new Date(device.pausedUntil) : null;
  if (pausedUntil && pausedUntil > context.now) {
    reasons.push({ kind: "paused", until: pausedUntil.toISOString() });
  }

  for (const schedule of context.schedules) {
    if (schedule.deviceIds.includes(device.id) && isScheduleActive(schedule, context.now, context.timeZone)) {
      reasons.push({ kind: "schedule", scheduleId: schedule.id, name: schedule.name });
    }
  }

  if (context.quarantineNewDevices && device.isNew) reasons.push({ kind: "quarantine" });

  if (device.dailyQuotaMB && device.quotaAction === "block") {
    const usedMB = (context.usageToday?.[device.id] ?? 0) / 1e6;
    if (usedMB >= device.dailyQuotaMB) {
      reasons.push({ kind: "quota", usedMB: Math.round(usedMB), quotaMB: device.dailyQuotaMB });
    }
  }

  // A temporary allowance overrides every reason until it runs out.
  const allowedUntil = device.allowedUntil ? new Date(device.allowedUntil) : null;
  if (allowedUntil && allowedUntil > context.now) {
    return { ...NOT_BLOCKED, allowedUntil: allowedUntil.toISOString(), suspended: reasons };
  }

  return { ...NOT_BLOCKED, blocked: reasons.length > 0, reasons };
}

/**
 * When the next enabled schedule window for `deviceId` starts (strictly after
 * `now`), or null if no schedule covers the device.
 */
export function nextScheduleStart(
  schedules: AccessSchedule[],
  deviceId: string,
  now: Date,
  timeZone: string,
): Date | null {
  const { day, minute } = localTime(now, timeZone);
  let best: { delta: number; startMinute: number } | null = null;
  for (const schedule of schedules) {
    if (!schedule.enabled || schedule.startMinute === schedule.endMinute) continue;
    if (!schedule.deviceIds.includes(deviceId)) continue;
    for (let offset = 0; offset <= 7; offset++) {
      if (!schedule.days.includes((day + offset) % 7)) continue;
      const delta = offset * 1440 + schedule.startMinute - minute;
      if (delta <= 0) continue;
      if (!best || delta < best.delta) best = { delta, startMinute: schedule.startMinute };
      break;
    }
  }
  if (!best) return null;
  return atLocalMinute(new Date(now.getTime() + best.delta * 60_000), best.startMinute, timeZone);
}

/** The next time the clock reaches the schedule's end time (within 24h). */
export function nextScheduleEnd(schedule: AccessSchedule, now: Date, timeZone: string): Date {
  const { minute } = localTime(now, timeZone);
  const delta = (schedule.endMinute - minute + 1440) % 1440 || 1440;
  return atLocalMinute(new Date(now.getTime() + delta * 60_000), schedule.endMinute, timeZone);
}

/** Nudges `date` (already within a DST shift of it) onto local `minute`. */
function atLocalMinute(date: Date, minute: number, timeZone: string): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  let drift = minute - localTime(result, timeZone).minute;
  if (drift > 720) drift -= 1440;
  if (drift < -720) drift += 1440;
  return new Date(result.getTime() + drift * 60_000);
}

export function describeReason(reason: AccessReason): string {
  switch (reason.kind) {
    case "manual":
      return "Blocked";
    case "paused":
      return `Paused until ${new Date(reason.until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    case "schedule":
      return `Schedule: ${reason.name}`;
    case "quarantine":
      return "Quarantined (new device)";
    case "quota":
      return `Daily quota used (${reason.usedMB}/${reason.quotaMB} MB)`;
  }
}

/** "Allowed until 21:00", with the weekday when that isn't within a day. */
export function describeAllowance(until: string | Date): string {
  const date = new Date(until);
  const far = date.getTime() - Date.now() > 20 * 3600_000;
  return `Allowed until ${date.toLocaleString([], {
    ...(far ? { weekday: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** The local calendar day of `date` in `timeZone`, as YYYY-MM-DD. */
export function localDateString(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftDateString(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/** The instant local day `date` (YYYY-MM-DD) starts in `timeZone`. */
export function startOfLocalDate(date: string, timeZone: string): Date {
  const target = Date.parse(`${date}T00:00:00Z`);
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let instant = target;
  // Converges in two rounds; the third covers a DST change right at midnight.
  for (let round = 0; round < 3; round++) {
    const parts = format.formatToParts(new Date(instant));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    instant -= shown - target;
  }
  return new Date(instant);
}

/** The instant of local midnight (start of today) in `timeZone`. */
export function startOfLocalDay(now: Date, timeZone: string): Date {
  const { minute } = localTime(now, timeZone);
  const start = new Date(now.getTime() - minute * 60_000);
  start.setSeconds(0, 0);
  return start;
}

export function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
