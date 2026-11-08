import { ObjectId } from "mongodb";

import { db } from "@/lib/db";
import { getAppDb } from "@/lib/db/mongo-native";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { COLLECTIONS } from "@/lib/network/collector/collections";
import type {
  CollectorStatus,
  DeviceDomainStat,
  DeviceUsage,
  LiveTrafficRow,
  PresenceEntry,
  RouterHealthReport,
  TopConsumer,
  TrafficHistoryPoint,
} from "@/types/network-insights";

/** Collector output older than this means it isn't running. */
export const COLLECTOR_STALE_MS = 45_000;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function startOfUtcDay(date = new Date()) {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

class NetworkInsightsService {
  async getCollectorStatus(userId: string): Promise<CollectorStatus> {
    const mongo = await getAppDb();
    const state = await mongo
      .collection(COLLECTIONS.state)
      .findOne(
        { userId: new ObjectId(userId) },
        { projection: { heartbeatAt: 1, lastError: 1, lastErrorAt: 1, lastDiscoveryAt: 1 } },
      );
    const heartbeatAt = state?.heartbeatAt as Date | undefined;
    return {
      running: !!heartbeatAt && Date.now() - heartbeatAt.getTime() < COLLECTOR_STALE_MS,
      heartbeatAt: heartbeatAt?.toISOString() ?? null,
      lastDiscoveryAt: (state?.lastDiscoveryAt as Date | undefined)?.toISOString() ?? null,
      lastError:
        state?.lastError && state.lastErrorAt && Date.now() - (state.lastErrorAt as Date).getTime() < 10 * 60_000
          ? String(state.lastError)
          : null,
    };
  }

  async getLiveTraffic(userId: string) {
    const mongo = await getAppDb();
    const state = await mongo
      .collection(COLLECTIONS.state)
      .findOne({ userId: new ObjectId(userId) }, { projection: { liveTraffic: 1, liveTrafficAt: 1 } });
    return {
      at: (state?.liveTrafficAt as Date | undefined)?.toISOString() ?? null,
      rows: (state?.liveTraffic as LiveTrafficRow[] | undefined) ?? [],
    };
  }

  /** Per-host total rate over time; averaged into buckets for longer windows. */
  async getTrafficHistory(userId: string, minutes: number): Promise<TrafficHistoryPoint[]> {
    const mongo = await getAppDb();
    const since = new Date(Date.now() - minutes * 60_000);
    const binSeconds = minutes <= 5 ? 0 : minutes <= 15 ? 10 : 30;
    const timeExpr = binSeconds
      ? { $dateTrunc: { date: "$ts", unit: "second", binSize: binSeconds } }
      : "$ts";

    const rows = await mongo
      .collection(COLLECTIONS.trafficSamples)
      .aggregate<{ _id: { t: Date; ip: string }; bits: number }>([
        { $match: { "meta.userId": new ObjectId(userId), ts: { $gte: since } } },
        {
          $group: {
            _id: { t: timeExpr, ip: "$meta.ip" },
            bits: { $avg: { $add: ["$bitsIn", "$bitsOut"] } },
          },
        },
        { $sort: { "_id.t": 1 } },
      ])
      .toArray();

    const points = new Map<number, Record<string, number>>();
    for (const row of rows) {
      const t = row._id.t.getTime();
      const values = points.get(t) ?? {};
      values[row._id.ip] = row.bits;
      points.set(t, values);
    }
    return [...points.entries()].map(([timestamp, values]) => ({ timestamp, values }));
  }

  async getTopConsumers(userId: string, since: Date, limit = 10): Promise<TopConsumer[]> {
    const mongo = await getAppDb();
    const rows = await mongo
      .collection(COLLECTIONS.usageHourly)
      .aggregate<{ _id: ObjectId; bytesIn: number; bytesOut: number; dnsQueries: number }>([
        { $match: { userId: new ObjectId(userId), hour: { $gte: since } } },
        {
          $group: {
            _id: "$deviceId",
            bytesIn: { $sum: "$bytesIn" },
            bytesOut: { $sum: "$bytesOut" },
            dnsQueries: { $sum: "$dnsQueries" },
          },
        },
        { $sort: { bytesIn: -1 } },
        { $limit: limit },
      ])
      .toArray();

    const devices = await db.networkDevice.findMany({
      where: { userId, id: { in: rows.map((row) => row._id.toHexString()) } },
    });
    const byId = new Map(devices.map((device) => [device.id, device]));
    return rows.map((row) => {
      const device = byId.get(row._id.toHexString());
      return {
        deviceId: row._id.toHexString(),
        name: device ? getDeviceDisplayName(device) : "Removed device",
        ipAddress: device?.ipAddress ?? null,
        bytesIn: row.bytesIn,
        bytesOut: row.bytesOut,
        dnsQueries: row.dnsQueries,
      };
    });
  }

  /** deviceId → bytes (in + out) since the start of today (UTC). */
  async getUsageTodayByDevice(userId: string): Promise<Record<string, number>> {
    const mongo = await getAppDb();
    const rows = await mongo
      .collection(COLLECTIONS.usageHourly)
      .aggregate<{ _id: ObjectId; bytes: number }>([
        { $match: { userId: new ObjectId(userId), hour: { $gte: startOfUtcDay() } } },
        { $group: { _id: "$deviceId", bytes: { $sum: { $add: ["$bytesIn", "$bytesOut"] } } } },
      ])
      .toArray();
    return Object.fromEntries(rows.map((row) => [row._id.toHexString(), row.bytes]));
  }

  async getDeviceUsage(userId: string, deviceId: string): Promise<DeviceUsage> {
    const mongo = await getAppDb();
    const match = {
      userId: new ObjectId(userId),
      deviceId: new ObjectId(deviceId),
      hour: { $gte: new Date(Date.now() - 30 * DAY) },
    };
    const docs = await mongo
      .collection<{ hour: Date; bytesIn: number; bytesOut: number; dnsQueries: number; dnsBlocked: number }>(
        COLLECTIONS.usageHourly,
      )
      .find(match, { projection: { _id: 0, hour: 1, bytesIn: 1, bytesOut: 1, dnsQueries: 1, dnsBlocked: 1 } })
      .sort({ hour: 1 })
      .toArray();

    const dayCut = Date.now() - DAY;
    const hourly = docs
      .filter((doc) => doc.hour.getTime() >= dayCut)
      .map((doc) => ({
        hour: doc.hour.toISOString(),
        bytesIn: doc.bytesIn,
        bytesOut: doc.bytesOut,
        dnsQueries: doc.dnsQueries,
        dnsBlocked: doc.dnsBlocked,
      }));

    const dailyMap = new Map<string, { bytesIn: number; bytesOut: number; dnsQueries: number; dnsBlocked: number }>();
    for (const doc of docs) {
      const key = startOfUtcDay(doc.hour).toISOString();
      const day = dailyMap.get(key) ?? { bytesIn: 0, bytesOut: 0, dnsQueries: 0, dnsBlocked: 0 };
      day.bytesIn += doc.bytesIn;
      day.bytesOut += doc.bytesOut;
      day.dnsQueries += doc.dnsQueries;
      day.dnsBlocked += doc.dnsBlocked;
      dailyMap.set(key, day);
    }
    const daily = [...dailyMap.entries()].map(([day, totals]) => ({ day, ...totals }));

    const sum = (from: number) =>
      docs
        .filter((doc) => doc.hour.getTime() >= from)
        .reduce((total, doc) => total + doc.bytesIn + doc.bytesOut, 0);

    return {
      hourly,
      daily,
      totals: {
        today: sum(startOfUtcDay().getTime()),
        last7Days: sum(Date.now() - 7 * DAY),
        last30Days: sum(0),
      },
    };
  }

  async getDeviceTopDomains(userId: string, deviceId: string, days = 7, limit = 15): Promise<DeviceDomainStat[]> {
    const mongo = await getAppDb();
    return mongo
      .collection(COLLECTIONS.dnsDaily)
      .aggregate<DeviceDomainStat>([
        {
          $match: {
            userId: new ObjectId(userId),
            deviceId: new ObjectId(deviceId),
            day: { $gte: startOfUtcDay(new Date(Date.now() - (days - 1) * DAY)) },
          },
        },
        { $group: { _id: "$domain", queries: { $sum: "$queries" }, blocked: { $sum: "$blocked" } } },
        { $sort: { queries: -1 } },
        { $limit: limit },
        { $project: { _id: 0, domain: "$_id", queries: 1, blocked: 1 } },
      ])
      .toArray();
  }

  async getDevicePresence(userId: string, deviceId: string, limit = 20): Promise<PresenceEntry[]> {
    const events = await db.networkPresenceEvent.findMany({
      where: { userId, deviceId },
      orderBy: { at: "desc" },
      take: limit,
    });
    return events.map((event) => ({ online: event.online, at: event.at.toISOString() }));
  }

  async getRouterHealth(userId: string, hours = 24): Promise<RouterHealthReport> {
    const mongo = await getAppDb();
    const userOid = new ObjectId(userId);
    const [state, series] = await Promise.all([
      mongo.collection(COLLECTIONS.state).findOne({ userId: userOid }, { projection: { routerInfo: 1, routerInfoAt: 1 } }),
      mongo
        .collection(COLLECTIONS.routerHealth)
        .aggregate<{
          _id: Date;
          cpuPct: number | null;
          memUsedPct: number | null;
          wanRx: number | null;
          wanTx: number | null;
        }>([
          { $match: { "meta.userId": userOid, ts: { $gte: new Date(Date.now() - hours * HOUR) } } },
          {
            $group: {
              _id: { $dateTrunc: { date: "$ts", unit: "minute", binSize: hours > 6 ? 10 : 2 } },
              cpuPct: { $avg: "$cpuPct" },
              memUsedPct: { $avg: "$memUsedPct" },
              wanRx: { $avg: "$interfaces.wan.rxBps" },
              wanTx: { $avg: "$interfaces.wan.txBps" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ]);

    return {
      info: (state?.routerInfo as RouterHealthReport["info"]) ?? null,
      infoAt: (state?.routerInfoAt as Date | undefined)?.toISOString() ?? null,
      series: series.map((row) => ({
        timestamp: row._id.getTime(),
        cpuPct: row.cpuPct,
        memUsedPct: row.memUsedPct,
        wanRxBps: row.wanRx,
        wanTxBps: row.wanTx,
      })),
    };
  }
}

export const networkInsightsService = new NetworkInsightsService();
