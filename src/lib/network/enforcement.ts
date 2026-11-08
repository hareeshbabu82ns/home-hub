import { db } from "@/lib/db";
import { decideAccess, resolveTimeZone, type AccessDecision } from "@/lib/network/access-policy";
import { networkAuditService } from "@/lib/services/network-audit.service";
import { BLOCK_ALIAS, networkControlService } from "@/lib/services/network-control.service";
import { networkSettingsService } from "@/lib/services/network-settings.service";

/**
 * Makes the router match the desired access state (MAC control mode).
 *
 *  1. Alias HH_Block content = MACs of devices that should be blocked
 *     (persistent; OPNsense resolves MACs to IPv4/IPv6 via ARP/NDP).
 *  2. Live pf table: add those devices' current addresses immediately and
 *     remove addresses of devices that are no longer blocked, so changes don't
 *     wait for OPNsense's next alias refresh.
 *  3. Kill open connections of newly blocked addresses.
 *
 * Runs every minute from the collector and right after every control action.
 */

export interface EnforcementResult {
  mode: "mac" | "ip";
  at: string;
  blockedDevices: number;
  aliasUpdated: boolean;
  addressesAdded: string[];
  addressesRemoved: string[];
  statesKilled: number;
  errors: string[];
}

const ADDRESS_MAX_AGE_MS = 30 * 60 * 1000;
const inFlight = new Map<string, Promise<EnforcementResult | null>>();

function isRoutableAddress(ip: string) {
  // Link-local IPv6 (fe80::…%if) never crosses the router.
  return !ip.includes("%") && !ip.toLowerCase().startsWith("fe80:");
}

export async function loadAccessDecisions(userId: string, now = new Date()) {
  const [settings, devices, schedules] = await Promise.all([
    db.networkIntegrationSettings.findUnique({ where: { userId } }),
    db.networkDevice.findMany({ where: { userId } }),
    db.networkAccessSchedule.findMany({ where: { userId } }),
  ]);
  const context = {
    schedules,
    quarantineNewDevices: settings?.quarantineNewDevices ?? false,
    now,
    timeZone: resolveTimeZone(settings?.timezone),
  };
  const decisions = new Map<string, AccessDecision>(
    devices.map((device) => [device.id, decideAccess(device, context)]),
  );
  return { settings, devices, decisions, timeZone: context.timeZone };
}

export function reconcileAccess(
  userId: string,
  options: { actorEmail?: string | null; trigger: string },
): Promise<EnforcementResult | null> {
  // One reconcile per user at a time; callers share the running one.
  const running = inFlight.get(userId);
  if (running) return running;
  const task = runReconcile(userId, options).finally(() => inFlight.delete(userId));
  inFlight.set(userId, task);
  return task;
}

async function runReconcile(
  userId: string,
  options: { actorEmail?: string | null; trigger: string },
): Promise<EnforcementResult | null> {
  const now = new Date();
  const { settings, devices, decisions } = await loadAccessDecisions(userId, now);
  if (!settings || settings.controlMode !== "mac" || !settings.blockAliasUuid) return null;

  const connection = await networkSettingsService.getConnection(userId);
  if (!connection) return null;

  const result: EnforcementResult = {
    mode: "mac",
    at: now.toISOString(),
    blockedDevices: 0,
    aliasUpdated: false,
    addressesAdded: [],
    addressesRemoved: [],
    statesKilled: 0,
    errors: [],
  };

  const blocked = devices.filter((device) => decisions.get(device.id)?.blocked);
  result.blockedDevices = blocked.length;

  // 1. Persistent MAC alias.
  const desiredMacs = [...new Set(blocked.map((device) => device.macAddress))].sort();
  const alias = await networkControlService.findAlias(connection, BLOCK_ALIAS);
  if (!alias) throw new Error(`Alias ${BLOCK_ALIAS} is missing on the router; run "Prepare router" again`);
  const currentMacs = [...new Set(alias.content.map((mac) => mac.toLowerCase()))].sort();
  if (desiredMacs.join() !== currentMacs.join()) {
    await networkControlService.writeAliasMacs(connection, alias.uuid, desiredMacs);
    result.aliasUpdated = true;
  }

  // 2. Live table, from addresses seen recently.
  const addresses = await db.networkDeviceAddress.findMany({
    where: {
      deviceId: { in: devices.map((device) => device.id) },
      lastSeenAt: { gt: new Date(now.getTime() - ADDRESS_MAX_AGE_MS) },
    },
    select: { deviceId: true, ip: true },
  });
  const addressesOf = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)!;
    return [
      device.ipAddress,
      ...addresses.filter((a) => a.deviceId === deviceId).map((a) => a.ip),
    ].filter(isRoutableAddress);
  };
  const desiredIps = new Set(blocked.flatMap((device) => addressesOf(device.id)));
  const releasedIps = new Set(
    devices
      .filter((device) => !decisions.get(device.id)?.blocked)
      .flatMap((device) => addressesOf(device.id))
      .filter((ip) => !desiredIps.has(ip)),
  );

  const table = new Set(await networkControlService.listTable(connection, BLOCK_ALIAS));
  for (const ip of desiredIps) {
    if (table.has(ip)) continue;
    try {
      await networkControlService.addToTable(connection, BLOCK_ALIAS, ip);
      result.addressesAdded.push(ip);
    } catch (error) {
      result.errors.push(`add ${ip}: ${(error as Error).message}`);
    }
  }
  // Only remove addresses we know belong to unblocked devices; anything else
  // in the table was resolved by OPNsense from a blocked MAC.
  for (const ip of table) {
    if (!releasedIps.has(ip)) continue;
    try {
      await networkControlService.removeFromTable(connection, BLOCK_ALIAS, ip);
      result.addressesRemoved.push(ip);
    } catch (error) {
      result.errors.push(`remove ${ip}: ${(error as Error).message}`);
    }
  }

  // 3. Cut existing connections of newly blocked devices. The alias reload
  // may already have put their addresses in the table, so don't rely on
  // addressesAdded alone.
  const previouslyBlocked = new Set(currentMacs);
  const killTargets = new Set([
    ...result.addressesAdded,
    ...blocked
      .filter((device) => !previouslyBlocked.has(device.macAddress))
      .flatMap((device) => addressesOf(device.id)),
  ]);
  for (const ip of killTargets) {
    try {
      result.statesKilled += await networkControlService.killStates(connection, ip);
    } catch (error) {
      result.errors.push(`kill states ${ip}: ${(error as Error).message}`);
    }
  }

  // Expired pauses are no longer relevant; clear them.
  await db.networkDevice.updateMany({
    where: { userId, pausedUntil: { lte: now } },
    data: { pausedUntil: null },
  });

  await db.networkCollectorState.upsert({
    where: { userId },
    create: { userId, enforcement: result as object, enforcementAt: now },
    update: { enforcement: result as object, enforcementAt: now },
  });

  const changed =
    result.aliasUpdated || result.addressesAdded.length > 0 || result.addressesRemoved.length > 0;
  if (changed || result.errors.length > 0) {
    await networkAuditService.record({
      userId,
      actorEmail: options.actorEmail ?? null,
      action: "enforce",
      target: options.trigger,
      success: result.errors.length === 0,
      error: result.errors.join("; ") || undefined,
      details: {
        blockedMacs: desiredMacs,
        added: result.addressesAdded,
        removed: result.addressesRemoved,
        statesKilled: result.statesKilled,
      },
    });
  }

  return result;
}
