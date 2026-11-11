import { ObjectId } from "mongodb";

import { db } from "@/lib/db";
import { getAppDb } from "@/lib/db/mongo-native";
import { localDateString, shiftDateString, startOfLocalDate } from "@/lib/network/access-policy";
import { COLLECTIONS } from "@/lib/network/collector/collections";
import type { DeviceDayStats, DeviceHistory, UsageBucket } from "@/types/network-insights";

/**
 * A device's recorded history for one local day, plus the 30 days leading up
 * to it. Usage is bucketed by UTC hour and DNS domains by UTC day, so in zones
 * that aren't whole hours from UTC the edges of a day are approximate.
 */

const HOUR = 60 * 60 * 1000;
const HISTORY_DAYS = 30;

const emptyBucket = (): UsageBucket => ({ bytesIn: 0, bytesOut: 0, dnsQueries: 0, dnsBlocked: 0 });

function add(target: UsageBucket, doc: UsageBucket) {
  target.bytesIn += doc.bytesIn ?? 0;
  target.bytesOut += doc.bytesOut ?? 0;
  target.dnsQueries += doc.dnsQueries ?? 0;
  target.dnsBlocked += doc.dnsBlocked ?? 0;
}

export function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function getDeviceHistory(
  userId: string,
  deviceId: string,
  timeZone: string,
  requestedDate?: string,
  now = new Date(),
): Promise<DeviceHistory> {
  const today = localDateString(now, timeZone);
  // Never past today.
  const date = requestedDate && requestedDate < today ? requestedDate : today;
  const start = startOfLocalDate(date, timeZone);
  const end = startOfLocalDate(shiftDateString(date, 1), timeZone);
  const firstDate = shiftDateString(date, -(HISTORY_DAYS - 1));
  const historyStart = startOfLocalDate(firstDate, timeZone);
  const floorHour = (instant: Date) => new Date(Math.floor(instant.getTime() / HOUR) * HOUR);

  const mongo = await getAppDb();
  const ids = { userId: new ObjectId(userId), deviceId: new ObjectId(deviceId) };
  const [usageDocs, domains, events, previous, following, device] = await Promise.all([
    mongo
      .collection<UsageBucket & { hour: Date }>(COLLECTIONS.usageHourly)
      .find(
        { ...ids, hour: { $gte: floorHour(historyStart), $lt: end } },
        { projection: { _id: 0, hour: 1, bytesIn: 1, bytesOut: 1, dnsQueries: 1, dnsBlocked: 1 } },
      )
      .toArray(),
    mongo
      .collection(COLLECTIONS.dnsDaily)
      .aggregate<{ domain: string; queries: number; blocked: number }>([
        { $match: { ...ids, day: new Date(`${date}T00:00:00Z`) } },
        { $group: { _id: "$domain", queries: { $sum: "$queries" }, blocked: { $sum: "$blocked" } } },
        { $sort: { queries: -1 } },
        { $limit: 15 },
        { $project: { _id: 0, domain: "$_id", queries: 1, blocked: 1 } },
      ])
      .toArray(),
    db.networkPresenceEvent.findMany({
      where: { userId, deviceId, at: { gte: start, lt: end } },
      orderBy: { at: "asc" },
    }),
    db.networkPresenceEvent.findFirst({
      where: { userId, deviceId, at: { lt: start } },
      orderBy: { at: "desc" },
    }),
    db.networkPresenceEvent.findFirst({
      where: { userId, deviceId, at: { gte: end } },
      orderBy: { at: "asc" },
    }),
    db.networkDevice.findFirst({ where: { id: deviceId, userId }, select: { isOnline: true, firstSeenAt: true } }),
  ]);

  // 30-day overview, by local day.
  const byDate = new Map<string, UsageBucket>();
  for (let offset = 0; offset < HISTORY_DAYS; offset++) byDate.set(shiftDateString(firstDate, offset), emptyBucket());
  for (const doc of usageDocs) {
    const bucket = byDate.get(localDateString(doc.hour, timeZone));
    if (bucket) add(bucket, doc);
  }

  // The selected day, hour by hour.
  const hourLabel = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const byHour = new Map(usageDocs.map((doc) => [doc.hour.getTime(), doc]));
  const hourly: DeviceDayStats["hourly"] = [];
  const totals = emptyBucket();
  for (let hour = floorHour(start).getTime(); hour < end.getTime(); hour += HOUR) {
    const bucket = emptyBucket();
    const doc = byHour.get(hour);
    if (doc) add(bucket, doc);
    add(totals, bucket);
    hourly.push({ hour: new Date(hour).toISOString(), label: hourLabel.format(new Date(hour)), ...bucket });
  }
  const peak = hourly.reduce<(typeof hourly)[number] | null>(
    (best, row) => (row.bytesIn + row.bytesOut > (best ? best.bytesIn + best.bytesOut : 0) ? row : best),
    null,
  );

  // Time online: replay the day's changes from the state it started in.
  // Only changes are recorded, so without an earlier one the starting state is
  // the opposite of the next change, or the current state if it never changed.
  let onlineMs: number | null = null;
  const startedOnline = previous
    ? previous.online
    : events.length
      ? !events[0]!.online
      : following
        ? !following.online
        : (device?.isOnline ?? null);
  const knownFrom = Math.max(start.getTime(), device?.firstSeenAt.getTime() ?? 0);
  const until = Math.min(end.getTime(), now.getTime());
  if (startedOnline !== null && knownFrom < until) {
    let online = startedOnline;
    let cursor = knownFrom;
    onlineMs = 0;
    for (const event of events) {
      if (online) onlineMs += event.at.getTime() - cursor;
      online = event.online;
      cursor = event.at.getTime();
    }
    if (online) onlineMs += Math.max(0, until - cursor);
  }

  return {
    timeZone,
    today,
    daily: [...byDate.entries()].map(([day, bucket]) => ({ date: day, ...bucket })),
    day: {
      date,
      start: start.toISOString(),
      end: end.toISOString(),
      hourly,
      totals,
      peakHour: peak ? { label: peak.label, bytes: peak.bytesIn + peak.bytesOut } : null,
      domains,
      presence: events.map((event) => ({ online: event.online, at: event.at.toISOString() })),
      onlineMs,
    },
  };
}
