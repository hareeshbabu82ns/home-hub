import { randomUUID } from "node:crypto";
import { hostname } from "node:os";

import { ObjectId, type AnyBulkWriteOperation, type Document } from "mongodb";

import { db } from "@/lib/db";
import { getAppDb } from "@/lib/db/mongo-native";
import { networkDeviceService } from "@/lib/services/network-device.service";
import { networkSettingsService } from "@/lib/services/network-settings.service";
import { networkTrafficService } from "@/lib/services/network-traffic.service";
import { opnsenseRequest, type OpnsenseConnection } from "@/lib/services/opnsense-client";
import { reconcileAccess } from "@/lib/network/enforcement";

import {
  COLLECTIONS,
  ensureNetworkCollections,
  ensureRetentionIndexes,
  type RouterHealthDoc,
  type TrafficSampleDoc,
} from "./collections";
import {
  alertsAfterDiscovery,
  alertsFromEnforcement,
  alertsFromHealth,
  cacheRouterControl,
  checkQuotas,
  routerReachability,
  sampleInternalFlows,
} from "./insight-jobs";
import {
  counterRates,
  parseCpuPct,
  parseGateways,
  parseInterfaceCounters,
  parseMemory,
  parseRootDisk,
  parseSystemTime,
  type InterfaceCounters,
} from "./router-metrics";

/**
 * Background collector for router data (Phase 2). One instance per database
 * does the work, guarded by a lease, so running it embedded in Next.js and as
 * a standalone script at the same time is safe.
 *
 *   traffic    continuous: top talkers → live snapshot, samples, hourly usage
 *   discovery  every 60s:  ARP/NDP/DHCP scan → online state, presence events
 *   dns        every 60s:  Unbound query log → hourly/daily DNS aggregates
 *   health     every 60s:  CPU, memory, gateways, interface throughput
 *   enforce    every 60s:  apply block/pause/schedule/quarantine/quota (MAC
 *                          mode), then quota and enforcement alerts
 *   flows      every 5min: LAN → other private network connections (pf states)
 *   users      every 2min: reload settings, TTL indexes, cached control status
 * Discovery and health also raise/resolve alerts (src/lib/network/alerts.ts).
 */

const LEASE_ID = "network-collector";
const LEASE_TTL_MS = 90_000;
const INTERVALS = {
  lease: 30_000,
  trafficGap: 1_000,
  discovery: 60_000,
  dns: 60_000,
  health: 60_000,
  enforce: 60_000,
  flows: 5 * 60_000,
  users: 120_000,
};
// Longest gap a traffic sample's rate is assumed to have lasted for.
const MAX_SAMPLE_SECONDS = 15;

type Logger = Pick<Console, "info" | "warn" | "error">;

interface UserContext {
  userId: string;
  userOid: ObjectId;
  connection: OpnsenseConnection;
  /** Same scope as a manual scan (Settings → default subnet). */
  defaultSubnet?: string;
  /** IPv4/IPv6 → device, refreshed after each discovery. */
  devicesByIp: Map<string, { id: string; name: string }>;
  lastTrafficAt?: number;
  lastCounters?: { at: number; counters: InterfaceCounters[] };
  /** Keys of DNS rows at the watermark second, to avoid double counting. */
  dnsBoundaryKeys: Set<string>;
  /** First failed router call since the last success (for alerts). */
  routerDownSince?: number;
}

function hourOf(date: Date) {
  const hour = new Date(date);
  hour.setUTCMinutes(0, 0, 0);
  return hour;
}

function dayOf(date: Date) {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export interface CollectorHandle {
  stop: () => Promise<void>;
}

export async function startNetworkCollector(
  options: { logger?: Logger } = {},
): Promise<CollectorHandle> {
  const log = options.logger ?? console;
  const owner = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let stopped = false;
  let isLeader = false;
  let users = new Map<string, UserContext>();

  await ensureNetworkCollections();
  const mongo = await getAppDb();

  // ---------------------------------------------------------------- helpers
  const every = (name: string, intervalMs: number, task: () => Promise<void>) => {
    const run = async () => {
      if (stopped) return;
      try {
        await task();
      } catch (error) {
        log.error(`[collector] ${name} failed:`, errorText(error));
      }
      if (!stopped) {
        const timer = setTimeout(() => {
          timers.delete(timer);
          void run();
        }, intervalMs);
        timers.add(timer);
      }
    };
    void run();
  };

  const forEachUser = async (job: string, task: (user: UserContext) => Promise<void>) => {
    if (!isLeader) return;
    for (const user of users.values()) {
      if (stopped) return;
      try {
        await task(user);
        if (user.routerDownSince) {
          user.routerDownSince = undefined;
          await routerReachability(user.userId, true);
        }
      } catch (error) {
        const message = `${job}: ${errorText(error)}`;
        if (/Router unreachable/.test(message)) {
          user.routerDownSince ??= Date.now();
          await routerReachability(user.userId, false, user.routerDownSince).catch(() => undefined);
        }
        log.warn(`[collector] user ${user.userId} ${message}`);
        await db.networkCollectorState.upsert({
          where: { userId: user.userId },
          create: { userId: user.userId, lastError: message, lastErrorAt: new Date() },
          update: { lastError: message, lastErrorAt: new Date() },
        });
      }
    }
  };

  // ------------------------------------------------------------------ lease
  const renewLease = async () => {
    const now = new Date();
    try {
      await mongo.collection<{ _id: string; owner: string; expiresAt: Date }>(COLLECTIONS.lease).findOneAndUpdate(
        { _id: LEASE_ID, $or: [{ owner }, { expiresAt: { $lt: now } }] },
        { $set: { owner, expiresAt: new Date(now.getTime() + LEASE_TTL_MS) } },
        { upsert: true },
      );
      if (!isLeader) log.info(`[collector] acquired lease as ${owner}`);
      isLeader = true;
    } catch (error) {
      // Duplicate key: another live collector holds the lease.
      if ((error as { code?: number }).code !== 11000) throw error;
      if (isLeader) log.warn("[collector] lost lease to another collector");
      isLeader = false;
    }
  };

  // ------------------------------------------------------------------ users
  const refreshDeviceMap = async (user: UserContext) => {
    const [devices, addresses] = await Promise.all([
      networkDeviceService.list(user.userId),
      db.networkDeviceAddress.findMany({
        where: {
          device: { userId: user.userId },
          lastSeenAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { deviceId: true, ip: true },
      }),
    ]);
    const nameById = new Map(
      devices.map((d) => [d.id, d.name || d.dhcpHostname || d.hostname || d.vendor || d.ipAddress]),
    );
    const map = new Map<string, { id: string; name: string }>();
    for (const address of addresses) {
      map.set(address.ip, { id: address.deviceId, name: nameById.get(address.deviceId) ?? address.ip });
    }
    // Current IPv4 holders win over history (online first).
    for (const device of [...devices].sort((a, b) => Number(a.isOnline) - Number(b.isOnline))) {
      map.set(device.ipAddress, { id: device.id, name: nameById.get(device.id)! });
    }
    user.devicesByIp = map;
  };

  const loadUsers = async () => {
    const settings = await db.networkIntegrationSettings.findMany({ select: { userId: true } });
    const next = new Map<string, UserContext>();
    for (const { userId } of settings) {
      try {
        const connection = await networkSettingsService.getConnection(userId);
        if (!connection) continue;
        const conn: OpnsenseConnection = {
          apiBaseUrl: connection.apiBaseUrl,
          apiKey: connection.apiKey,
          apiSecret: connection.apiSecret,
          verifyTls: connection.verifyTls,
        };
        const previous = users.get(userId);
        next.set(userId, {
          ...(previous ?? { devicesByIp: new Map(), dnsBoundaryKeys: new Set() }),
          userId,
          userOid: new ObjectId(userId),
          connection: conn,
          defaultSubnet: connection.defaultSubnet ?? undefined,
        });
      } catch (error) {
        log.warn(`[collector] skipping user ${userId}: ${errorText(error)}`);
      }
    }
    users = next;
    for (const user of users.values()) {
      if (user.devicesByIp.size === 0) await refreshDeviceMap(user);
    }
  };

  // ---------------------------------------------------------------- traffic
  const collectTraffic = async (user: UserContext) => {
    const records = await networkTrafficService.getTopLan(user.connection);
    const now = new Date();
    const elapsed = user.lastTrafficAt
      ? Math.min((now.getTime() - user.lastTrafficAt) / 1000, MAX_SAMPLE_SECONDS)
      : 0;
    user.lastTrafficAt = now.getTime();

    const live = records.map((record) => {
      const device = user.devicesByIp.get(record.address);
      return {
        address: record.address,
        deviceId: device?.id ?? null,
        name: device?.name ?? (record.rname || record.address),
        rateBitsIn: record.rateBitsIn,
        rateBitsOut: record.rateBitsOut,
        rateBits: record.rateBits,
      };
    });

    if (records.length > 0) {
      await mongo.collection<TrafficSampleDoc>(COLLECTIONS.trafficSamples).insertMany(
        live.map((row) => ({
          ts: now,
          meta: { userId: user.userOid, ip: row.address },
          ...(row.deviceId ? { deviceId: new ObjectId(row.deviceId) } : {}),
          bitsIn: row.rateBitsIn,
          bitsOut: row.rateBitsOut,
        })),
      );
    }

    // Estimated bytes: sampled rate × time since the previous sample.
    const usage: AnyBulkWriteOperation<Document>[] = live
      .filter((row) => row.deviceId && elapsed > 0)
      .map((row) => ({
        updateOne: {
          filter: { deviceId: new ObjectId(row.deviceId!), hour: hourOf(now) },
          update: {
            $inc: {
              bytesIn: (row.rateBitsIn / 8) * elapsed,
              bytesOut: (row.rateBitsOut / 8) * elapsed,
            },
            $setOnInsert: { userId: user.userOid, dnsQueries: 0, dnsBlocked: 0 },
          },
          upsert: true,
        },
      }));
    if (usage.length) await mongo.collection(COLLECTIONS.usageHourly).bulkWrite(usage, { ordered: false });

    await mongo.collection(COLLECTIONS.state).updateOne(
      { userId: user.userOid },
      {
        $set: { liveTraffic: live, liveTrafficAt: now, heartbeatAt: now },
        // Prisma requires non-null fields to exist on read.
        $setOnInsert: { dnsWatermark: 0 },
      },
      { upsert: true },
    );
  };

  // -------------------------------------------------------------- discovery
  const collectDiscovery = async (user: UserContext) => {
    const before = await networkDeviceService.list(user.userId);
    const wasOnline = new Map(before.map((d) => [d.id, d.isOnline]));

    const result = await networkDeviceService.scanAndSave(user.userId, {
      ...user.connection,
      subnet: user.defaultSubnet,
    });
    const now = new Date();

    const events = result.devices
      .filter((d) => wasOnline.get(d.id) !== d.isOnline && (wasOnline.has(d.id) || d.isOnline))
      .map((d) => ({ userId: user.userId, deviceId: d.id, online: d.isOnline, at: now }));
    if (events.length) await db.networkPresenceEvent.createMany({ data: events });

    await alertsAfterDiscovery(user.userId, before, result.devices);
    await refreshDeviceMap(user);
    await db.networkCollectorState.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, lastDiscoveryAt: now, heartbeatAt: now },
      update: { lastDiscoveryAt: now, heartbeatAt: now },
    });
    if (events.length || result.blocksMoved) {
      log.info(
        `[collector] user ${user.userId}: ${events.length} presence change(s), ${result.blocksMoved} block(s) moved`,
      );
    }
  };

  // -------------------------------------------------------------------- dns
  const collectDns = async (user: UserContext) => {
    const state = await db.networkCollectorState.findUnique({ where: { userId: user.userId } });
    const watermark = state?.dnsWatermark ?? 0;

    const payload = await opnsenseRequest<{ rows?: Record<string, unknown>[] }>(
      user.connection,
      "unbound/overview/search_queries",
      { body: { current: 1, rowCount: 1000, sort: {} } },
    );
    const rows = (payload.rows ?? []).map((row) => ({
      time: Number(row.time) || 0,
      client: String(row.client ?? ""),
      domain: String(row.domain ?? "").replace(/\.$/, "").toLowerCase(),
      type: String(row.type ?? ""),
      blocked: String(row.action ?? "Pass") !== "Pass",
    }));
    if (rows.length === 0) return;

    const keyOf = (row: (typeof rows)[number]) => `${row.time}|${row.client}|${row.domain}|${row.type}`;
    const fresh = rows.filter(
      (row) => row.time > watermark || (row.time === watermark && !user.dnsBoundaryKeys.has(keyOf(row))),
    );
    const oldest = Math.min(...rows.map((row) => row.time));
    if (watermark > 0 && oldest > watermark + 1) {
      log.warn(`[collector] user ${user.userId}: DNS log gap of ${oldest - watermark}s (router keeps only 1000 queries)`);
    }

    const hourly = new Map<string, { deviceId: string; hour: Date; queries: number; blocked: number }>();
    const daily = new Map<string, { deviceId: string; day: Date; domain: string; queries: number; blocked: number }>();
    for (const row of fresh) {
      const device = user.devicesByIp.get(row.client);
      if (!device || !row.domain) continue;
      const at = new Date(row.time * 1000);
      const hour = hourOf(at);
      const hk = `${device.id}|${hour.toISOString()}`;
      const h = hourly.get(hk) ?? { deviceId: device.id, hour, queries: 0, blocked: 0 };
      h.queries++;
      if (row.blocked) h.blocked++;
      hourly.set(hk, h);

      const day = dayOf(at);
      const dk = `${device.id}|${day.toISOString()}|${row.domain}`;
      const d = daily.get(dk) ?? { deviceId: device.id, day, domain: row.domain, queries: 0, blocked: 0 };
      d.queries++;
      if (row.blocked) d.blocked++;
      daily.set(dk, d);
    }

    if (hourly.size) {
      await mongo.collection(COLLECTIONS.usageHourly).bulkWrite(
        [...hourly.values()].map((h) => ({
          updateOne: {
            filter: { deviceId: new ObjectId(h.deviceId), hour: h.hour },
            update: {
              $inc: { dnsQueries: h.queries, dnsBlocked: h.blocked },
              $setOnInsert: { userId: user.userOid, bytesIn: 0, bytesOut: 0 },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }
    if (daily.size) {
      await mongo.collection(COLLECTIONS.dnsDaily).bulkWrite(
        [...daily.values()].map((d) => ({
          updateOne: {
            filter: { deviceId: new ObjectId(d.deviceId), day: d.day, domain: d.domain },
            update: {
              $inc: { queries: d.queries, blocked: d.blocked },
              $setOnInsert: { userId: user.userOid },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    const newest = Math.max(...rows.map((row) => row.time));
    user.dnsBoundaryKeys = new Set(rows.filter((row) => row.time === newest).map(keyOf));
    await db.networkCollectorState.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, dnsWatermark: newest },
      update: { dnsWatermark: newest },
    });
  };

  // ----------------------------------------------------------------- health
  const collectHealth = async (user: UserContext) => {
    const get = (path: string) =>
      opnsenseRequest(user.connection, path, { method: "GET" }).catch(() => undefined);
    const [activity, resources, time, disk, info, gateways, counters, names] = await Promise.all([
      get("diagnostics/activity/get_activity"),
      get("diagnostics/system/system_resources"),
      get("diagnostics/system/system_time"),
      get("diagnostics/system/system_disk"),
      get("diagnostics/system/system_information"),
      get("routes/gateway/status"),
      get("diagnostics/traffic/interface"),
      get("diagnostics/interface/get_interface_names"),
    ]);
    const now = new Date();

    const current = {
      at: now.getTime(),
      counters: parseInterfaceCounters(counters, (names ?? {}) as Record<string, string>),
    };
    const rates = counterRates(user.lastCounters, current);
    user.lastCounters = current;

    const memory = parseMemory(resources);
    const systemTime = parseSystemTime(time);
    const cpuPct = parseCpuPct(activity);
    const gatewayList = parseGateways(gateways);

    const doc: RouterHealthDoc = {
      ts: now,
      meta: { userId: user.userOid },
      cpuPct,
      memUsedPct: memory?.usedPct,
      load1: systemTime.load1,
      interfaces: rates,
      gateways: gatewayList.map(({ name, status, delayMs, lossPct }) => ({ name, status, delayMs, lossPct })),
    };
    await mongo.collection<RouterHealthDoc>(COLLECTIONS.routerHealth).insertOne(doc);
    await alertsFromHealth(user.userId, {
      gateways: gatewayList,
      memoryUsedPct: memory?.usedPct,
      diskUsedPct: parseRootDisk(disk)?.usedPct,
    });

    const infoRow = (info ?? {}) as { name?: string; versions?: string[] };
    await mongo.collection(COLLECTIONS.state).updateOne(
      { userId: user.userOid },
      {
        $set: {
          heartbeatAt: now,
          routerInfoAt: now,
          routerInfo: {
            name: infoRow.name,
            version: infoRow.versions?.[0],
            os: infoRow.versions?.[1],
            uptime: systemTime.uptime,
            loadavg: systemTime.loadavg,
            cpuPct,
            memory,
            disk: parseRootDisk(disk),
            gateways: gatewayList,
            interfaces: current.counters.map((c) => ({
              key: c.key,
              device: c.device,
              name: c.name,
              rxBps: rates[c.key]?.rxBps,
              txBps: rates[c.key]?.txBps,
            })),
          },
        },
        $setOnInsert: { dnsWatermark: 0 },
      },
      { upsert: true },
    );
  };

  // ------------------------------------------------------------------ start
  every("lease", INTERVALS.lease, renewLease);
  every("users", INTERVALS.users, async () => {
    await loadUsers();
    if (isLeader) await ensureRetentionIndexes();
    await forEachUser("router-control", (user) => cacheRouterControl(user.userId, user.connection));
  });
  // Give lease/users a moment so the first rounds have something to do.
  const startJobs = setTimeout(() => {
    timers.delete(startJobs);
    every("traffic", INTERVALS.trafficGap, () => forEachUser("traffic", collectTraffic));
    every("discovery", INTERVALS.discovery, () => forEachUser("discovery", collectDiscovery));
    every("dns", INTERVALS.dns, () => forEachUser("dns", collectDns));
    every("health", INTERVALS.health, () => forEachUser("health", collectHealth));
    // Pauses expire and schedules start/end on the minute; addresses change.
    every("enforce", INTERVALS.enforce, () =>
      forEachUser("enforce", async (user) => {
        const result = await reconcileAccess(user.userId, { trigger: "collector" });
        await alertsFromEnforcement(user.userId, result);
        await checkQuotas(user.userId);
        if (result?.errors.length) throw new Error(result.errors.join("; "));
      }),
    );
    every("flows", INTERVALS.flows, () =>
      forEachUser("flows", async (user) => {
        await sampleInternalFlows(user, user.devicesByIp);
      }),
    );
  }, 2_000);
  timers.add(startJobs);

  log.info(`[collector] started (${owner})`);

  return {
    stop: async () => {
      stopped = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      if (isLeader) {
        await mongo
          .collection<{ _id: string; owner: string }>(COLLECTIONS.lease)
          .deleteOne({ _id: LEASE_ID, owner })
          .catch(() => undefined);
      }
      log.info("[collector] stopped");
    },
  };
}
