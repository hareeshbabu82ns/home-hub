import { ObjectId, type AnyBulkWriteOperation, type Document } from "mongodb";

import { db } from "@/lib/db";
import { getAppDb } from "@/lib/db/mongo-native";
import { raiseAlert, resolveAlert, resolveAllExcept } from "@/lib/network/alerts";
import { resolveTimeZone, startOfLocalDay } from "@/lib/network/access-policy";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { getUsageSinceLocalMidnight, type EnforcementResult } from "@/lib/network/enforcement";
import { networkControlService } from "@/lib/services/network-control.service";
import { opnsenseRequest, type OpnsenseConnection } from "@/lib/services/opnsense-client";

import { COLLECTIONS } from "./collections";
import type { parseGateways } from "./router-metrics";

/** Phase 4 collector work: alert evaluation, internal flows, cached status. */

type Device = Awaited<ReturnType<typeof db.networkDevice.findMany>>[number];

// ------------------------------------------------------------------ alerts

export async function alertsAfterDiscovery(userId: string, before: Device[], after: Device[]) {
  const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
  const quarantine = settings?.controlMode === "mac" && !!settings.quarantineNewDevices;
  const known = new Set(before.map((device) => device.id));

  for (const device of after) {
    if (known.has(device.id) || device.role !== "CLIENT") continue;
    const name = getDeviceDisplayName(device);
    await raiseAlert(userId, {
      kind: "new_device",
      severity: quarantine ? "warning" : "info",
      title: `New device: ${name}`,
      message: `${name} (${device.macAddress}${device.vendor ? `, ${device.vendor}` : ""}) joined at ${device.ipAddress}${device.intfDescription ? ` on ${device.intfDescription}` : ""}.${quarantine ? " It is quarantined until you review it." : ""}`,
      dedupeKey: `new:${device.id}`,
      deviceId: device.id,
    });
  }
  // Reviewed devices close their "new device" alert.
  await resolveAllExcept(
    userId,
    "new_device",
    after.filter((device) => device.isNew).map((device) => `new:${device.id}`),
  );

  // Two online devices claiming one IP: misconfiguration or spoofing.
  const byIp = new Map<string, Device[]>();
  for (const device of after.filter((d) => d.isOnline)) {
    byIp.set(device.ipAddress, [...(byIp.get(device.ipAddress) ?? []), device]);
  }
  const conflicts = [...byIp.entries()].filter(([, devices]) => devices.length > 1);
  for (const [ip, devices] of conflicts) {
    await raiseAlert(userId, {
      kind: "ip_conflict",
      severity: "warning",
      title: `IP conflict on ${ip}`,
      message: `${devices.map((d) => `${getDeviceDisplayName(d)} (${d.macAddress})`).join(" and ")} both use ${ip}.`,
      dedupeKey: `ip:${ip}`,
    });
  }
  await resolveAllExcept(userId, "ip_conflict", conflicts.map(([ip]) => `ip:${ip}`));
}

export async function alertsFromHealth(
  userId: string,
  input: {
    gateways: ReturnType<typeof parseGateways>;
    memoryUsedPct?: number;
    diskUsedPct?: number;
  },
) {
  const down = input.gateways.filter((g) => !/online/i.test(g.status));
  for (const gateway of down) {
    await raiseAlert(userId, {
      kind: "gateway_down",
      severity: "critical",
      title: `Gateway ${gateway.name} is ${gateway.status.toLowerCase()}`,
      message: `The router reports gateway ${gateway.name} (${gateway.address ?? "no address"}) as ${gateway.status}.`,
      dedupeKey: `gw-down:${gateway.name}`,
    });
  }
  await resolveAllExcept(userId, "gateway_down", down.map((g) => `gw-down:${g.name}`));

  // Only meaningful when the gateway has a monitor IP (delay/loss reported).
  const degraded = input.gateways.filter(
    (g) => /online/i.test(g.status) && ((g.lossPct ?? 0) >= 10 || (g.delayMs ?? 0) >= 150),
  );
  for (const gateway of degraded) {
    await raiseAlert(userId, {
      kind: "gateway_degraded",
      severity: "warning",
      title: `Gateway ${gateway.name} is degraded`,
      message: `${gateway.name}: ${gateway.delayMs?.toFixed(0) ?? "?"} ms latency, ${gateway.lossPct ?? 0}% packet loss.`,
      dedupeKey: `gw-degraded:${gateway.name}`,
    });
  }
  await resolveAllExcept(userId, "gateway_degraded", degraded.map((g) => `gw-degraded:${g.name}`));

  const problems: string[] = [];
  if ((input.memoryUsedPct ?? 0) >= 95) problems.push(`memory ${input.memoryUsedPct!.toFixed(0)}%`);
  if ((input.diskUsedPct ?? 0) >= 90) problems.push(`disk ${input.diskUsedPct}%`);
  if (problems.length) {
    await raiseAlert(userId, {
      kind: "router_resources",
      severity: "warning",
      title: "Router is low on resources",
      message: `The router is at ${problems.join(" and ")}.`,
      dedupeKey: "resources",
    });
  } else {
    await resolveAlert(userId, "resources");
  }
}

export async function alertsFromEnforcement(userId: string, result: EnforcementResult | null) {
  if (result?.errors.length) {
    await raiseAlert(userId, {
      kind: "enforcement_failed",
      severity: "warning",
      title: "Access rules couldn't be fully applied",
      message: `The router rejected part of the update: ${result.errors.join("; ")}`,
      dedupeKey: "enforce",
    });
  } else if (result) {
    await resolveAlert(userId, "enforce");
  }
}

export async function checkQuotas(userId: string) {
  const devices = await db.networkDevice.findMany({ where: { userId, dailyQuotaMB: { gt: 0 } } });
  if (devices.length === 0) {
    await resolveAllExcept(userId, "quota_exceeded", []);
    return;
  }
  const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
  const timeZone = resolveTimeZone(settings?.timezone);
  const now = new Date();
  const usage = await getUsageSinceLocalMidnight(userId, timeZone, now);
  const day = startOfLocalDay(now, timeZone).toISOString().slice(0, 10);

  const over = devices.filter((device) => (usage[device.id] ?? 0) / 1e6 >= device.dailyQuotaMB!);
  for (const device of over) {
    const name = getDeviceDisplayName(device);
    const usedMB = Math.round((usage[device.id] ?? 0) / 1e6);
    await raiseAlert(userId, {
      kind: "quota_exceeded",
      severity: "warning",
      title: `${name} used its daily data quota`,
      message: `${name} has used about ${usedMB} MB of its ${device.dailyQuotaMB} MB daily quota.${device.quotaAction === "block" && settings?.controlMode === "mac" ? " It is blocked until midnight." : ""}`,
      dedupeKey: `quota:${device.id}:${day}`,
      deviceId: device.id,
    });
  }
  // A new day uses new keys, so yesterday's alerts resolve here.
  await resolveAllExcept(userId, "quota_exceeded", over.map((d) => `quota:${d.id}:${day}`));
}

export async function routerReachability(userId: string, reachable: boolean, downSince?: number) {
  if (reachable) {
    await resolveAlert(userId, "router-unreachable");
    return;
  }
  if (downSince && Date.now() - downSince >= 3 * 60_000) {
    await raiseAlert(userId, {
      kind: "router_unreachable",
      severity: "critical",
      title: "Router unreachable",
      message: `Home Hub hasn't been able to reach the router API since ${new Date(downSince).toLocaleTimeString()}.`,
      dedupeKey: "router-unreachable",
    });
  }
}

// ---------------------------------------------------------- internal flows

function isPrivate(ip: string) {
  if (ip.includes(":")) return /^f[cd]/i.test(ip); // ULA; link-local excluded
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/** Subnet broadcasts (x.x.x.255) and multicast aren't connections to a host. */
function isBroadcastOrMulticast(ip: string) {
  if (ip.includes(":")) return ip.toLowerCase().startsWith("ff");
  const octets = ip.split(".").map(Number);
  return octets[3] === 255 || (octets[0] >= 224 && octets[0] <= 239);
}

/**
 * Samples pf states for connections from LAN devices to other private
 * addresses (other networks behind or beside the router). Traffic between two
 * hosts on the same LAN is switched directly and never appears here.
 */
export async function sampleInternalFlows(
  user: { userId: string; userOid: ObjectId; connection: OpnsenseConnection },
  devicesByIp: Map<string, { id: string; name: string }>,
) {
  const [states, devices] = await Promise.all([
    opnsenseRequest<{ rows?: Record<string, unknown>[] }>(
      user.connection,
      "diagnostics/firewall/query_states",
      { body: { current: 1, rowCount: 5000, searchPhrase: "" }, timeoutMs: 30_000 },
    ),
    db.networkDevice.findMany({
      where: { userId: user.userId },
      select: { id: true, role: true, ipAddress: true, isUpstream: true },
    }),
  ]);
  const infraIps = new Set(devices.filter((d) => d.role === "INFRASTRUCTURE").map((d) => d.ipAddress));
  const lanDeviceIds = new Set(devices.filter((d) => d.role === "CLIENT" && !d.isUpstream).map((d) => d.id));

  const now = new Date();
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  const seen = new Map<string, { src: string; dstIp: string; dstDeviceId?: string; proto: string; port: number }>();

  for (const row of states.rows ?? []) {
    const proto = String(row.proto ?? "").toLowerCase();
    if (proto !== "tcp" && proto !== "udp") continue;
    const srcIp = String(row.src_addr ?? "");
    const dstIp = String(row.dst_addr ?? "");
    const port = Number(row.dst_port);
    const src = devicesByIp.get(srcIp);
    if (!src || !lanDeviceIds.has(src.id) || !Number.isFinite(port)) continue;
    if (!isPrivate(dstIp) || infraIps.has(dstIp) || isBroadcastOrMulticast(dstIp)) continue;
    const dst = devicesByIp.get(dstIp);
    if (dst?.id === src.id) continue;
    // Same-LAN pairs can only show up via the router itself; skip them.
    if (dst && lanDeviceIds.has(dst.id)) continue;
    const key = `${src.id}|${dstIp}|${proto}|${port}`;
    seen.set(key, { src: src.id, dstIp, dstDeviceId: dst?.id, proto, port });
  }

  if (seen.size === 0) return 0;
  const mongo = await getAppDb();
  const ops: AnyBulkWriteOperation<Document>[] = [...seen.values()].map((flow) => ({
    updateOne: {
      filter: {
        srcDeviceId: new ObjectId(flow.src),
        day,
        dstIp: flow.dstIp,
        proto: flow.proto,
        dstPort: flow.port,
      },
      update: {
        $inc: { samples: 1 },
        $set: { lastSeenAt: now, ...(flow.dstDeviceId ? { dstDeviceId: new ObjectId(flow.dstDeviceId) } : {}) },
        $setOnInsert: { userId: user.userOid },
      },
      upsert: true,
    },
  }));
  await mongo.collection(COLLECTIONS.internalFlows).bulkWrite(ops, { ordered: false });
  return seen.size;
}

// ------------------------------------------------------ cached router status

/** Device pages read this instead of making several router calls each load. */
export async function cacheRouterControl(userId: string, connection: OpnsenseConnection) {
  const status = await networkControlService.getSetupStatus(connection);
  await db.networkCollectorState.upsert({
    where: { userId },
    create: { userId, routerControl: status as object, routerControlAt: new Date() },
    update: { routerControl: status as object, routerControlAt: new Date() },
  });
}
