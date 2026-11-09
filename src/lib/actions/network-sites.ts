"use server";

import { z } from "zod";

import { db } from "@/lib/db";
import { errorMessage, getActor, NOT_CONFIGURED, requireManager } from "@/lib/network/action-helpers";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { GLOBAL_SCOPE, normalizeDomain, syncSiteFilter, type SiteFilterResult } from "@/lib/network/site-filter";
import { networkAuditService } from "@/lib/services/network-audit.service";

/** Website (domain) block/allow rules: for all devices or one device. */

function fail(error: unknown, fallback: string) {
  return { success: false as const, error: errorMessage(error, fallback) };
}

function serialize(rule: { id: string; scope: string; domain: string; action: string; createdAt: Date; createdBy: string | null }) {
  return {
    id: rule.id,
    scope: rule.scope,
    domain: rule.domain,
    action: rule.action as "block" | "allow",
    createdAt: rule.createdAt.toISOString(),
    createdBy: rule.createdBy,
  };
}

export type SiteRule = ReturnType<typeof serialize>;

async function syncStatus(userId: string) {
  const state = await db.networkCollectorState.findUnique({ where: { userId } });
  return (state?.siteFilter as SiteFilterResult | null) ?? null;
}

/** Rules for the Websites page: global plus every device's. */
export async function getAllSiteRules() {
  try {
    const { userId, canManage } = await getActor();
    const [rules, status] = await Promise.all([
      db.networkSiteRule.findMany({ where: { userId }, orderBy: { domain: "asc" } }),
      syncStatus(userId),
    ]);
    const deviceIds = [...new Set(rules.filter((r) => r.scope !== GLOBAL_SCOPE).map((r) => r.scope))];
    const devices = await db.networkDevice.findMany({ where: { userId, id: { in: deviceIds } } });
    const names = new Map(devices.map((d) => [d.id, getDeviceDisplayName(d)]));
    return {
      success: true as const,
      data: {
        canManage,
        status,
        global: rules.filter((r) => r.scope === GLOBAL_SCOPE).map(serialize),
        devices: deviceIds
          .map((id) => ({
            deviceId: id,
            name: names.get(id) ?? "Removed device",
            rules: rules.filter((r) => r.scope === id).map(serialize),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      },
    };
  } catch (error) {
    return fail(error, "Failed to load website rules");
  }
}

/** Rules for one device's page, plus the global blocks that also apply to it. */
export async function getDeviceSiteRules(deviceId: string) {
  try {
    const { userId, canManage } = await getActor();
    const device = await db.networkDevice.findFirst({ where: { id: deviceId, userId } });
    if (!device) return { success: false as const, error: "Device not found" };
    const [rules, status] = await Promise.all([
      db.networkSiteRule.findMany({
        where: { userId, scope: { in: [GLOBAL_SCOPE, device.id] } },
        orderBy: { domain: "asc" },
      }),
      syncStatus(userId),
    ]);
    return {
      success: true as const,
      data: {
        canManage,
        eligible: device.role === "CLIENT" && !device.isUpstream,
        inactive: status?.inactiveDevices.includes(getDeviceDisplayName(device)) ?? false,
        status,
        device: rules.filter((r) => r.scope === device.id).map(serialize),
        global: rules.filter((r) => r.scope === GLOBAL_SCOPE).map(serialize),
      },
    };
  } catch (error) {
    return fail(error, "Failed to load website rules");
  }
}

const addSchema = z.object({
  scope: z.string().min(1), // "global" or a device id
  domain: z.string().min(1).max(300),
  action: z.enum(["block", "allow"]),
});

export async function addSiteRule(values: z.infer<typeof addSchema>) {
  try {
    const { userId, email } = await requireManager();
    const parsed = addSchema.parse(values);
    const domain = normalizeDomain(parsed.domain);
    if (!domain) return { success: false as const, error: `"${parsed.domain}" isn't a website domain` };

    const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
    if (!settings) return { success: false as const, error: NOT_CONFIGURED };

    let target = "all devices";
    if (parsed.scope === GLOBAL_SCOPE) {
      if (parsed.action === "allow") {
        return { success: false as const, error: "Allow exceptions are per device" };
      }
    } else {
      const device = await db.networkDevice.findFirst({ where: { id: parsed.scope, userId } });
      if (!device) return { success: false as const, error: "Device not found" };
      if (device.role !== "CLIENT" || device.isUpstream) {
        return { success: false as const, error: "Website rules apply to LAN client devices only" };
      }
      target = getDeviceDisplayName(device);
    }

    const existing = await db.networkSiteRule.findFirst({
      where: { userId, scope: parsed.scope, domain },
    });
    if (existing?.action === parsed.action) {
      return { success: false as const, error: `${domain} is already ${parsed.action === "block" ? "blocked" : "allowed"}` };
    }

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: parsed.action === "block" ? "site-block" : "site-allow",
        target: `${domain} (${target})`,
        deviceId: parsed.scope === GLOBAL_SCOPE ? undefined : parsed.scope,
      },
      async () => {
        // Switching block <-> allow replaces the rule.
        if (existing) await db.networkSiteRule.delete({ where: { id: existing.id } });
        await db.networkSiteRule.create({
          data: { userId, scope: parsed.scope, domain, action: parsed.action, createdBy: email },
        });
      },
    );

    const sync = await syncSiteFilter(userId, { actorEmail: email, trigger: "rule added" });
    return {
      success: true as const,
      domain,
      warning: sync?.errors.length ? `Saved, but the router update failed: ${sync.errors.join("; ")}` : undefined,
    };
  } catch (error) {
    return fail(error, "Failed to add website rule");
  }
}

export async function removeSiteRule(id: string) {
  try {
    const { userId, email } = await requireManager();
    const rule = await db.networkSiteRule.findFirst({ where: { id, userId } });
    if (!rule) return { success: false as const, error: "Rule not found" };

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: "site-rule-remove",
        target: `${rule.domain} (${rule.scope === GLOBAL_SCOPE ? "all devices" : "device"}, ${rule.action})`,
        deviceId: rule.scope === GLOBAL_SCOPE ? undefined : rule.scope,
      },
      () => db.networkSiteRule.delete({ where: { id: rule.id } }),
    );

    const sync = await syncSiteFilter(userId, { actorEmail: email, trigger: "rule removed" });
    return {
      success: true as const,
      warning: sync?.errors.length ? `Removed, but the router update failed: ${sync.errors.join("; ")}` : undefined,
    };
  } catch (error) {
    return fail(error, "Failed to remove website rule");
  }
}
