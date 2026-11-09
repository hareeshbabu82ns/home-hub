import type { Db, ObjectId } from "mongodb";

import { getAppDb } from "@/lib/db/mongo-native";

/** Native collections and retention for the network collector. */
export const COLLECTIONS = {
  trafficSamples: "network_traffic_samples",
  routerHealth: "network_router_health",
  lease: "network_collector_lease",
  // Prisma-modelled collections (names follow the model names).
  usageHourly: "NetworkUsageHourly",
  dnsDaily: "NetworkDnsDaily",
  presence: "NetworkPresenceEvent",
  audit: "NetworkAuditLog",
  alerts: "NetworkAlert",
  internalFlows: "NetworkInternalFlowDaily",
  state: "NetworkCollectorState",
} as const;

const DAY = 24 * 60 * 60;
export const RETENTION_SECONDS = {
  trafficSamples: 2 * DAY,
  routerHealth: 30 * DAY,
  usageHourly: 400 * DAY,
  dnsDaily: 90 * DAY,
  presence: 180 * DAY,
  audit: 365 * DAY,
  alerts: 180 * DAY,
  internalFlows: 30 * DAY,
} as const;

export interface TrafficSampleDoc {
  ts: Date;
  meta: { userId: ObjectId; ip: string };
  deviceId?: ObjectId;
  bitsIn: number;
  bitsOut: number;
}

export interface RouterHealthDoc {
  ts: Date;
  meta: { userId: ObjectId };
  cpuPct?: number;
  memUsedPct?: number;
  load1?: number;
  interfaces: Record<string, { rxBps: number; txBps: number }>;
  gateways: { name: string; status: string; delayMs?: number; lossPct?: number }[];
}

let ensured: Promise<void> | undefined;

async function ensureTimeSeries(db: Db, name: string, expireAfterSeconds: number) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name, {
      timeseries: { timeField: "ts", metaField: "meta", granularity: "seconds" },
      expireAfterSeconds,
    });
  } else {
    await db.command({ collMod: name, expireAfterSeconds });
  }
}

async function ensureTtl(db: Db, collection: string, field: string, seconds: number) {
  const name = `${field}_ttl`;
  const indexes = await db
    .collection(collection)
    .indexes()
    .catch(() => []);
  const current = indexes.find((index) => index.name === name);
  if (current?.expireAfterSeconds === seconds) return;
  if (current) await db.collection(collection).dropIndex(name);
  await db.collection(collection).createIndex({ [field]: 1 }, { name, expireAfterSeconds: seconds });
}

/**
 * TTL indexes on Prisma-managed collections. `prisma db push` drops indexes it
 * doesn't know about, so the collector re-checks these periodically.
 */
export async function ensureRetentionIndexes(): Promise<void> {
  const db = await getAppDb();
  await ensureTtl(db, COLLECTIONS.usageHourly, "hour", RETENTION_SECONDS.usageHourly);
  await ensureTtl(db, COLLECTIONS.dnsDaily, "day", RETENTION_SECONDS.dnsDaily);
  await ensureTtl(db, COLLECTIONS.presence, "at", RETENTION_SECONDS.presence);
  await ensureTtl(db, COLLECTIONS.audit, "at", RETENTION_SECONDS.audit);
  await ensureTtl(db, COLLECTIONS.alerts, "createdAt", RETENTION_SECONDS.alerts);
  await ensureTtl(db, COLLECTIONS.internalFlows, "day", RETENTION_SECONDS.internalFlows);
}

/** Idempotent; safe to call on every collector start. */
export function ensureNetworkCollections(): Promise<void> {
  ensured ??= (async () => {
    const db = await getAppDb();
    await ensureTimeSeries(db, COLLECTIONS.trafficSamples, RETENTION_SECONDS.trafficSamples);
    await ensureTimeSeries(db, COLLECTIONS.routerHealth, RETENTION_SECONDS.routerHealth);
    await db.collection(COLLECTIONS.trafficSamples).createIndex({ "meta.userId": 1, ts: -1 });
    await db.collection(COLLECTIONS.routerHealth).createIndex({ "meta.userId": 1, ts: -1 });
    await ensureRetentionIndexes();
  })().catch((error) => {
    ensured = undefined;
    throw error;
  });
  return ensured;
}
