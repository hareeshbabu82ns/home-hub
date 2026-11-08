/**
 * Desired access state for a device (Phase 3). Pure functions: the reconciler
 * turns the result into router state, the UI uses it to explain why.
 */

export type AccessReason =
  | { kind: "manual" }
  | { kind: "paused"; until: string }
  | { kind: "schedule"; scheduleId: string; name: string }
  | { kind: "quarantine" };

export interface AccessDecision {
  blocked: boolean;
  reasons: AccessReason[];
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
}

export interface AccessSchedule {
  id: string;
  name: string;
  enabled: boolean;
  days: number[];
  startMinute: number;
  endMinute: number;
  deviceIds: string[];
}

export interface AccessContext {
  schedules: AccessSchedule[];
  quarantineNewDevices: boolean;
  now: Date;
  timeZone: string;
}

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

export function isScheduleActive(schedule: AccessSchedule, now: Date, timeZone: string): boolean {
  if (!schedule.enabled || schedule.startMinute === schedule.endMinute) return false;
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
    return { blocked: false, reasons: [], exempt: "Router and gateway addresses can't be blocked" };
  }
  if (device.isUpstream) {
    return { blocked: false, reasons: [], exempt: "WAN-side device: LAN firewall rules don't filter it" };
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

  return { blocked: reasons.length > 0, reasons, exempt: null };
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
  }
}

export function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
