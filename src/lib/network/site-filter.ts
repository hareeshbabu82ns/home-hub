import { db } from "@/lib/db";
import { getAppDb } from "@/lib/db/mongo-native";
import { COLLECTIONS } from "@/lib/network/collector/collections";
import { GLOBAL_SCOPE } from "@/lib/network/site-filter-constants";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { networkAuditService } from "@/lib/services/network-audit.service";
import {
  networkControlService,
  SITE_POLICY_PREFIX,
  type SitePolicy,
  type SitePolicyInput,
} from "@/lib/services/network-control.service";
import { networkSettingsService } from "@/lib/services/network-settings.service";

/**
 * Website filtering through Unbound DNSBL policies (DNS level).
 *
 * - "all devices" policy (no source networks): globally blocked domains.
 * - one policy per device (source networks = the device's current addresses):
 *   its blocked domains, plus allow exceptions.
 *
 * OPNsense applies the blocks of every policy matching a client (union), so
 * global and per-device blocks add up, and the router's own lists (AdGuard…)
 * keep working. Each domain goes in "blocklists" (the exact name) and
 * "wildcards" (its subdomains): wildcards alone left example.com itself
 * reachable in testing. A device's allowlist only overrides domains its own
 * policy lists, so allowed domains are listed there too.
 *
 * DNS filtering can be bypassed by devices using another resolver (DNS over
 * HTTPS, VPNs); see the Websites page note.
 */

export { GLOBAL_SCOPE };
/**
 * Several Home Hub accounts can point at the same router, so every policy is
 * tied to its owner: the global one carries the user id, device ones the
 * (globally unique) device id. A sync only touches its own policies; deleting
 * "unknown" ones made two accounts delete each other's policies every minute.
 */
function globalDescription(userId: string) {
  return `${SITE_POLICY_PREFIX} all devices [u:${userId}]`;
}
const ADDRESS_MAX_AGE_MS = 30 * 60 * 1000;

const DOMAIN_PATTERN = /^(?=.{1,253}$)((?!-)[a-z0-9-]{1,63}(?<!-)\.)+(xn--[a-z0-9-]{2,59}|[a-z]{2,63})$/;

/** "https://www.YouTube.com/watch?v=1" → "youtube.com"; null if not a domain. */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // scheme
  value = value.split(/[/?#]/)[0] ?? ""; // path, query, fragment
  value = value.replace(/^\*\./, "").replace(/:\d+$/, "").replace(/\.$/, "");
  value = value.replace(/^www\./, "");
  return DOMAIN_PATTERN.test(value) ? value : null;
}

/**
 * Allowlist entries are joined into a regex and matched from the start of the
 * queried name, so ".*example.com" covers example.com and its subdomains.
 */
function allowPattern(domain: string) {
  return `.*${domain}`;
}

function deviceDescription(name: string, deviceId: string) {
  // The [id] suffix is how the policy is found again; keep the name short.
  return `${SITE_POLICY_PREFIX} ${name.replace(/[[\]]/g, "").slice(0, 60)} [${deviceId}]`;
}

/** This user's key for a policy, or null when it belongs to someone else. */
function policyKey(policy: SitePolicy, userId: string, ownDeviceIds: Set<string>): string | null {
  if (policy.description === globalDescription(userId)) return GLOBAL_SCOPE;
  const deviceId = policy.description.match(/\[([0-9a-f]{24})\]$/)?.[1];
  return deviceId && ownDeviceIds.has(deviceId) ? deviceId : null;
}

function sameSet(a: string[], b: string[]) {
  return [...a].sort().join(",") === [...b].sort().join(",");
}

function isRoutable(ip: string) {
  return !ip.includes("%") && !ip.toLowerCase().startsWith("fe80:") && !ip.startsWith("169.254.");
}

export interface SiteFilterResult {
  at: string;
  policies: number;
  created: number;
  updated: number;
  deleted: number;
  applied: boolean;
  /** Devices with rules but no current address: their policy is disabled. */
  inactiveDevices: string[];
  errors: string[];
}

interface SyncEntry {
  running: Promise<SiteFilterResult | null>;
  followUp?: Promise<SiteFilterResult | null>;
}
const inFlight = new Map<string, SyncEntry>();

const LOCK_TTL_MS = 4 * 60_000;

/**
 * Cross-process lock (server actions and the collector may live in different
 * module instances or processes). Two overlapping rebuilds on the router make
 * the second one exit early, and OPNsense still answers "OK" (`|| true`), so a
 * change could silently not apply.
 */
async function withSyncLock<T>(userId: string, waitMs: number, task: () => Promise<T>): Promise<T | null> {
  const mongo = await getAppDb();
  const locks = mongo.collection<{ _id: string; owner: string; expiresAt: Date }>(COLLECTIONS.lease);
  const id = `site-filter:${userId}`;
  const owner = `${process.pid}:${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + waitMs;
  for (;;) {
    const now = new Date();
    try {
      await locks.findOneAndUpdate(
        { _id: id, $or: [{ expiresAt: { $lt: now } }, { owner }] },
        { $set: { owner, expiresAt: new Date(now.getTime() + LOCK_TTL_MS) } },
        { upsert: true },
      );
      break; // acquired
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      if (Date.now() > deadline) return null; // held elsewhere
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  try {
    return await task();
  } finally {
    await locks.deleteOne({ _id: id, owner }).catch(() => undefined);
  }
}

/**
 * User actions wait for a running sync (up to 3 min); the collector skips the
 * round instead.
 */
export function syncSiteFilter(
  userId: string,
  options: { actorEmail?: string | null; trigger: string; wait?: boolean },
): Promise<SiteFilterResult | null> {
  const current = inFlight.get(userId);
  if (current) {
    // The running sync read the rules before this change: queue exactly one
    // follow-up run (later callers share it), since each run makes the router
    // rebuild its whole blocklist (~1 min).
    if (options.wait === false) return current.running;
    current.followUp ??= current.running
      .catch(() => null)
      .then(() => startSync(userId, options));
    return current.followUp;
  }
  return startSync(userId, options);
}

function startSync(
  userId: string,
  options: { actorEmail?: string | null; trigger: string; wait?: boolean },
): Promise<SiteFilterResult | null> {
  const running = withSyncLock(userId, options.wait === false ? 0 : 180_000, () => runSync(userId, options));
  const entry: SyncEntry = { running };
  inFlight.set(userId, entry);
  void running
    .catch(() => null)
    .finally(() => {
      if (inFlight.get(userId) === entry && !entry.followUp) inFlight.delete(userId);
    });
  return running;
}

async function runSync(
  userId: string,
  options: { actorEmail?: string | null; trigger: string },
): Promise<SiteFilterResult | null> {
  const connection = await networkSettingsService.getConnection(userId);
  if (!connection) return null;

  const now = new Date();
  const [rules, allPolicies, ownDevices] = await Promise.all([
    db.networkSiteRule.findMany({ where: { userId } }),
    networkControlService.listSitePolicies(connection),
    db.networkDevice.findMany({ where: { userId }, select: { id: true } }),
  ]);
  const ownDeviceIds = new Set(ownDevices.map((d) => d.id));
  const existing = allPolicies.filter((policy) => policyKey(policy, userId, ownDeviceIds) !== null);
  const state = await db.networkCollectorState.findUnique({ where: { userId } });
  const previous = state?.siteFilter as (SiteFilterResult & { confirmPending?: boolean }) | null;
  // Nothing to manage, nothing left over, nothing to confirm: skip the router.
  if (rules.length === 0 && existing.length === 0 && !previous?.confirmPending) return null;

  const deviceIds = [...new Set(rules.filter((r) => r.scope !== GLOBAL_SCOPE).map((r) => r.scope))];
  const [devices, onlineDevices, addresses] = await Promise.all([
    db.networkDevice.findMany({ where: { userId, id: { in: deviceIds } } }),
    db.networkDevice.findMany({ where: { userId, isOnline: true }, select: { id: true, ipAddress: true } }),
    db.networkDeviceAddress.findMany({
      where: { deviceId: { in: deviceIds }, lastSeenAt: { gt: new Date(now.getTime() - ADDRESS_MAX_AGE_MS) } },
      select: { deviceId: true, ip: true },
    }),
  ]);
  // An address currently held by another online device isn't this device's.
  const onlineOwner = new Map(onlineDevices.map((d) => [d.ipAddress, d.id]));

  const desired = new Map<string, SitePolicyInput>();
  const globalBlocks = rules.filter((r) => r.scope === GLOBAL_SCOPE && r.action === "block").map((r) => r.domain);
  if (globalBlocks.length > 0) {
    desired.set(GLOBAL_SCOPE, {
      description: globalDescription(userId),
      enabled: true,
      sourceNets: [],
      blocklists: globalBlocks,
      wildcards: globalBlocks,
      allowlists: [],
    });
  }

  const inactiveDevices: string[] = [];
  for (const device of devices) {
    if (device.role !== "CLIENT" || device.isUpstream) continue;
    const deviceRules = rules.filter((r) => r.scope === device.id);
    const blocks = deviceRules.filter((r) => r.action === "block").map((r) => r.domain);
    const allows = deviceRules.filter((r) => r.action === "allow").map((r) => r.domain);
    if (blocks.length + allows.length === 0) continue;

    const recent = device.isOnline || device.lastSeenAt.getTime() > now.getTime() - ADDRESS_MAX_AGE_MS;
    const sourceNets = [
      ...new Set([
        ...(recent ? [device.ipAddress] : []),
        ...addresses.filter((a) => a.deviceId === device.id).map((a) => a.ip),
      ]),
    ]
      .filter(isRoutable)
      .filter((ip) => (onlineOwner.get(ip) ?? device.id) === device.id);

    const name = getDeviceDisplayName(device);
    if (sourceNets.length === 0) inactiveDevices.push(name);
    desired.set(device.id, {
      description: deviceDescription(name, device.id),
      // Empty source networks would mean "every client": never enable that.
      enabled: sourceNets.length > 0,
      sourceNets,
      blocklists: [...new Set([...blocks, ...allows])],
      wildcards: [...new Set([...blocks, ...allows])],
      allowlists: allows.map(allowPattern),
    });
  }

  const result: SiteFilterResult = {
    at: now.toISOString(),
    policies: desired.size,
    created: 0,
    updated: 0,
    deleted: 0,
    applied: false,
    inactiveDevices,
    errors: [],
  };

  const byKey = new Map<string, SitePolicy>();
  for (const policy of existing) {
    const key = policyKey(policy, userId, ownDeviceIds)!;
    if (!byKey.has(key)) {
      byKey.set(key, policy);
    } else {
      // Duplicate of one of this user's policies: remove it.
      try {
        await networkControlService.deleteSitePolicy(connection, policy.uuid);
        result.deleted++;
      } catch (error) {
        result.errors.push(`delete ${policy.description}: ${(error as Error).message}`);
      }
    }
  }

  for (const [key, input] of desired) {
    const current = byKey.get(key);
    try {
      if (!current) {
        await networkControlService.saveSitePolicy(connection, null, input);
        result.created++;
      } else if (
        current.enabled !== input.enabled ||
        current.description !== input.description ||
        !sameSet(current.sourceNets, input.sourceNets) ||
        !sameSet(current.blocklists, input.blocklists) ||
        !sameSet(current.wildcards, input.wildcards) ||
        !sameSet(current.allowlists, input.allowlists)
      ) {
        await networkControlService.saveSitePolicy(connection, current.uuid, input);
        result.updated++;
      }
    } catch (error) {
      result.errors.push(`${input.description}: ${(error as Error).message}`);
    }
  }
  for (const [key, policy] of byKey) {
    if (desired.has(key)) continue;
    try {
      await networkControlService.deleteSitePolicy(connection, policy.uuid);
      result.deleted++;
    } catch (error) {
      result.errors.push(`delete ${policy.description}: ${(error as Error).message}`);
    }
  }

  const changed = result.created + result.updated + result.deleted > 0;
  // A change is applied now and once more on a later run: the router can drop
  // a rebuild silently (its own list refresh holding the lock).
  let confirmPending = false;
  if (changed || previous?.confirmPending) {
    try {
      await networkControlService.applySitePolicies(connection);
      result.applied = true;
      confirmPending = changed;
    } catch (error) {
      result.errors.push(`apply: ${(error as Error).message}`);
      confirmPending = true;
    }
  }
  if (changed) {
    await networkAuditService.record({
      userId,
      actorEmail: options.actorEmail ?? null,
      action: "sites-sync",
      target: options.trigger,
      success: result.errors.length === 0,
      error: result.errors.join("; ") || undefined,
      details: {
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        inactiveDevices,
      },
    });
  }

  const stored = { ...result, confirmPending };
  await db.networkCollectorState.upsert({
    where: { userId },
    create: { userId, siteFilter: stored as object, siteFilterAt: now },
    update: { siteFilter: stored as object, siteFilterAt: now },
  });
  return result;
}
