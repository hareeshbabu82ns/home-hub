"use server";

import { z } from "zod";

import { db } from "@/lib/db";
import {
  errorMessage,
  getActor,
  getRequesterIp,
  NOT_CONFIGURED,
  requireManager,
} from "@/lib/network/action-helpers";
import { resolveTimeZone } from "@/lib/network/access-policy";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { loadAccessDecisions, reconcileAccess, type EnforcementResult } from "@/lib/network/enforcement";
import { networkAuditService } from "@/lib/services/network-audit.service";
import {
  LEGACY_BLOCK_ALIAS,
  networkControlService,
  type ControlSetupStatus,
} from "@/lib/services/network-control.service";
import { networkSettingsService } from "@/lib/services/network-settings.service";

/** Phase 3: access control (MAC mode), schedules, router operations, audit. */

const MAC_MODE_REQUIRED = 'Prepare the router first (Settings → Network → "Router control")';

async function requireConnection(userId: string) {
  const connection = await networkSettingsService.getConnection(userId);
  if (!connection) throw new Error(NOT_CONFIGURED);
  return {
    apiBaseUrl: connection.apiBaseUrl,
    apiKey: connection.apiKey,
    apiSecret: connection.apiSecret,
    verifyTls: connection.verifyTls,
  };
}

async function requireMacMode(userId: string) {
  const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
  if (settings?.controlMode !== "mac") throw new Error(MAC_MODE_REQUIRED);
  return settings;
}

async function getDeviceOrThrow(userId: string, id: string) {
  const device = await db.networkDevice.findFirst({ where: { id, userId } });
  if (!device) throw new Error("Device not found");
  return device;
}

function fail(error: unknown, fallback: string) {
  const message =
    error instanceof Error && [NOT_CONFIGURED, MAC_MODE_REQUIRED, "Device not found"].includes(error.message)
      ? error.message
      : errorMessage(error, fallback);
  return { success: false as const, error: message };
}

// ------------------------------------------------------------ router control

export async function getRouterControl() {
  try {
    const { userId, canManage } = await getActor();
    const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
    if (!settings) return { success: false as const, error: NOT_CONFIGURED };

    const connection = await requireConnection(userId);
    const [setup, state] = await Promise.all([
      networkControlService.getSetupStatus(connection),
      db.networkCollectorState.findUnique({ where: { userId } }),
    ]);
    return {
      success: true as const,
      data: {
        canManage,
        mode: settings.controlMode === "mac" ? ("mac" as const) : ("ip" as const),
        quarantineNewDevices: settings.quarantineNewDevices ?? false,
        timeZone: resolveTimeZone(settings.timezone),
        timeZoneSetting: settings.timezone ?? null,
        serverTimeZone: resolveTimeZone(null),
        setup,
        enforcement: (state?.enforcement as EnforcementResult | null) ?? null,
      },
    };
  } catch (error) {
    return fail(error, "Failed to load router control status");
  }
}

/**
 * Creates the HH_Block MAC alias and floating block rule, moves any devices
 * blocked through the legacy Blocked_Devices alias onto it, and switches to
 * MAC control mode.
 */
export async function prepareRouterControl() {
  try {
    const { userId, email } = await requireManager();
    const connection = await requireConnection(userId);

    const outcome = await networkAuditService.track(
      { userId, actorEmail: email, action: "prepare-router" },
      async () => {
        const prepared = await networkControlService.prepareRouter(connection);

        // Carry over legacy IP blocks as device-level (MAC) blocks.
        const legacyIps = await networkControlService.listTable(connection, LEGACY_BLOCK_ALIAS).catch(() => []);
        const migrated: string[] = [];
        for (const ip of legacyIps) {
          const device = await db.networkDevice.findFirst({
            where: { userId, ipAddress: ip, role: "CLIENT" },
            orderBy: [{ isOnline: "desc" }, { lastSeenAt: "desc" }],
          });
          if (!device) continue;
          await db.networkDevice.update({ where: { id: device.id }, data: { blocked: true } });
          migrated.push(ip);
        }

        await db.networkIntegrationSettings.update({
          where: { userId },
          data: {
            controlMode: "mac",
            blockAliasUuid: prepared.aliasUuid,
            blockRuleUuid: prepared.ruleUuid,
          },
        });

        const result = await reconcileAccess(userId, { actorEmail: email, trigger: "prepare-router" });
        // Only release legacy entries once the MAC alias covers them.
        for (const ip of migrated) {
          await networkControlService.removeFromTable(connection, LEGACY_BLOCK_ALIAS, ip).catch(() => undefined);
        }
        return { ...prepared, migrated, enforcement: result };
      },
    );

    return { success: true as const, data: outcome };
  } catch (error) {
    return fail(error, "Failed to prepare the router");
  }
}

export async function setQuarantineNewDevices(enabled: boolean) {
  try {
    const { userId, email } = await requireManager();
    await requireMacMode(userId);
    await networkAuditService.track(
      { userId, actorEmail: email, action: enabled ? "quarantine-on" : "quarantine-off" },
      async () => {
        await db.networkIntegrationSettings.update({
          where: { userId },
          data: { quarantineNewDevices: enabled },
        });
        await reconcileAccess(userId, { actorEmail: email, trigger: "quarantine" });
      },
    );
    return { success: true as const };
  } catch (error) {
    return fail(error, "Failed to update quarantine setting");
  }
}

/** Timezone for schedules, quotas and "today"; null = server TZ. */
export async function setNetworkTimezone(timeZone: string | null) {
  try {
    const { userId, email } = await requireManager();
    if (timeZone !== null && resolveTimeZone(timeZone) !== timeZone) {
      return { success: false as const, error: `Unknown timezone "${timeZone}"` };
    }
    const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
    if (!settings) return { success: false as const, error: NOT_CONFIGURED };
    await networkAuditService.track(
      { userId, actorEmail: email, action: "timezone", target: timeZone ?? "server default" },
      async () => {
        await db.networkIntegrationSettings.update({ where: { userId }, data: { timezone: timeZone } });
        // Schedule windows may have just started or ended in the new zone.
        await reconcileAccess(userId, { actorEmail: email, trigger: "timezone" });
      },
    );
    return { success: true as const, timeZone: resolveTimeZone(timeZone) };
  } catch (error) {
    return fail(error, "Failed to set timezone");
  }
}

// --------------------------------------------------------------------- pause

const pauseSchema = z.object({
  id: z.string().min(1),
  // 0 resumes; otherwise up to 24h.
  minutes: z.number().int().min(0).max(24 * 60),
  confirmSelf: z.boolean().optional(),
});

export async function pauseDevice(values: z.infer<typeof pauseSchema>) {
  try {
    const { userId, email } = await requireManager();
    const parsed = pauseSchema.parse(values);
    await requireMacMode(userId);
    const device = await getDeviceOrThrow(userId, parsed.id);

    const exempt = (await loadAccessDecisions(userId)).decisions.get(device.id)?.exempt;
    if (parsed.minutes > 0 && exempt) return { success: false as const, error: exempt };

    if (parsed.minutes > 0 && !parsed.confirmSelf) {
      const requesterIp = await getRequesterIp();
      if (requesterIp && device.ipAddress === requesterIp) {
        return {
          success: false as const,
          requiresConfirmation: true,
          error: "This looks like the device you're using right now. Pausing it will cut off your access.",
        };
      }
    }

    const pausedUntil = parsed.minutes > 0 ? new Date(Date.now() + parsed.minutes * 60_000) : null;
    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: pausedUntil ? "pause" : "resume",
        target: getDeviceDisplayName(device),
        deviceId: device.id,
        details: pausedUntil ? { until: pausedUntil.toISOString(), minutes: parsed.minutes } : {},
      },
      async () => {
        await db.networkDevice.update({ where: { id: device.id }, data: { pausedUntil } });
        const result = await reconcileAccess(userId, { actorEmail: email, trigger: "pause" });
        if (result?.errors.length) throw new Error(result.errors.join("; "));
      },
    );
    return { success: true as const, pausedUntil: pausedUntil?.toISOString() ?? null };
  } catch (error) {
    return fail(error, "Failed to pause device");
  }
}

// ----------------------------------------------------------------- schedules

const scheduleSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Name is required").max(60),
    enabled: z.boolean(),
    days: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day"),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(0).max(1439),
    deviceIds: z.array(z.string().min(1)).min(1, "Pick at least one device"),
  })
  .refine((value) => value.startMinute !== value.endMinute, {
    message: "Start and end time must differ",
  });

export async function listAccessSchedules() {
  try {
    const { userId, canManage } = await getActor();
    const [schedules, devices, settings] = await Promise.all([
      db.networkAccessSchedule.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      db.networkDevice.findMany({
        where: { userId, role: "CLIENT", isUpstream: false },
        orderBy: [{ name: "asc" }, { dhcpHostname: "asc" }],
      }),
      db.networkIntegrationSettings.findUnique({ where: { userId } }),
    ]);
    return {
      success: true as const,
      data: {
        canManage,
        mode: settings?.controlMode === "mac" ? ("mac" as const) : ("ip" as const),
        timeZone: resolveTimeZone(settings?.timezone),
        schedules,
        devices: devices.map((device) => ({
          id: device.id,
          name: getDeviceDisplayName(device),
          ipAddress: device.ipAddress,
        })),
      },
    };
  } catch (error) {
    return fail(error, "Failed to load schedules");
  }
}

export async function saveAccessSchedule(values: z.infer<typeof scheduleSchema>) {
  try {
    const { userId, email } = await requireManager();
    const parsed = scheduleSchema.parse(values);
    await requireMacMode(userId);

    // Only this user's blockable devices.
    const allowed = await db.networkDevice.findMany({
      where: { userId, id: { in: parsed.deviceIds }, role: "CLIENT", isUpstream: false },
      select: { id: true },
    });
    const data = {
      name: parsed.name,
      enabled: parsed.enabled,
      days: [...new Set(parsed.days)].sort(),
      startMinute: parsed.startMinute,
      endMinute: parsed.endMinute,
      deviceIds: allowed.map((device) => device.id),
    };

    const schedule = await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: parsed.id ? "schedule-update" : "schedule-create",
        target: parsed.name,
        details: data,
      },
      async () => {
        const saved = parsed.id
          ? await db.networkAccessSchedule.update({
              where: { id: (await db.networkAccessSchedule.findFirstOrThrow({ where: { id: parsed.id, userId } })).id },
              data,
            })
          : await db.networkAccessSchedule.create({ data: { ...data, userId } });
        await reconcileAccess(userId, { actorEmail: email, trigger: "schedule" });
        return saved;
      },
    );
    return { success: true as const, schedule };
  } catch (error) {
    return fail(error, "Failed to save schedule");
  }
}

export async function deleteAccessSchedule(id: string) {
  try {
    const { userId, email } = await requireManager();
    const schedule = await db.networkAccessSchedule.findFirst({ where: { id, userId } });
    if (!schedule) return { success: false as const, error: "Schedule not found" };
    await networkAuditService.track(
      { userId, actorEmail: email, action: "schedule-delete", target: schedule.name },
      async () => {
        await db.networkAccessSchedule.delete({ where: { id: schedule.id } });
        await reconcileAccess(userId, { actorEmail: email, trigger: "schedule" });
      },
    );
    return { success: true as const };
  } catch (error) {
    return fail(error, "Failed to delete schedule");
  }
}

// ---------------------------------------------------------- router operations

export async function getDeviceControlOptions(id: string) {
  try {
    const { userId, canManage } = await getActor();
    const device = await getDeviceOrThrow(userId, id);
    const connection = await requireConnection(userId);
    const [settings, state] = await Promise.all([
      db.networkIntegrationSettings.findUnique({ where: { userId } }),
      db.networkCollectorState.findUnique({ where: { userId } }),
    ]);
    // The collector refreshes this every 2 minutes; fall back to the router.
    const cacheFresh =
      state?.routerControl && state.routerControlAt && Date.now() - state.routerControlAt.getTime() < 10 * 60_000;
    const setup = cacheFresh
      ? (state!.routerControl as unknown as ControlSetupStatus)
      : await networkControlService.getSetupStatus(connection);
    const suggested = (device.name || device.dhcpHostname || device.hostname || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);
    return {
      success: true as const,
      data: {
        canManage,
        mode: settings?.controlMode === "mac" ? ("mac" as const) : ("ip" as const),
        wolAvailable: setup.wolAvailable,
        routerDomain: setup.routerDomain,
        suggestedHostname: suggested || null,
      },
    };
  } catch (error) {
    return fail(error, "Failed to load device options");
  }
}

export async function wakeDevice(id: string) {
  try {
    const { userId, email } = await requireManager();
    const device = await getDeviceOrThrow(userId, id);
    const connection = await requireConnection(userId);
    if (!(await networkControlService.isWolAvailable(connection))) {
      return { success: false as const, error: "Install the os-wol plugin on the router to use Wake-on-LAN" };
    }
    const interfaceKey = device.intf ? await networkControlService.interfaceKeyFor(connection, device.intf) : null;
    if (!interfaceKey) return { success: false as const, error: "Unknown interface for this device" };

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: "wake",
        target: getDeviceDisplayName(device),
        deviceId: device.id,
        details: { mac: device.macAddress, interface: interfaceKey },
      },
      () => networkControlService.wake(connection, interfaceKey, device.macAddress),
    );
    return { success: true as const };
  } catch (error) {
    return fail(error, "Failed to send Wake-on-LAN");
  }
}

const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, "Use letters, digits and hyphens (max 63)");
const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/, "Invalid domain");

export async function addDeviceDnsName(values: { id: string; hostname: string; domain: string }) {
  try {
    const { userId, email } = await requireManager();
    const hostname = hostnameSchema.parse(values.hostname);
    const domain = domainSchema.parse(values.domain);
    const device = await getDeviceOrThrow(userId, values.id);
    const connection = await requireConnection(userId);

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: "dns-name",
        target: `${hostname}.${domain}`,
        deviceId: device.id,
        details: { ip: device.ipAddress },
      },
      () =>
        networkControlService.addDnsName(connection, {
          hostname,
          domain,
          ip: device.ipAddress,
          description: `home-hub: ${getDeviceDisplayName(device)} (${device.macAddress})`,
        }),
    );
    return { success: true as const, fqdn: `${hostname}.${domain}` };
  } catch (error) {
    return fail(error, "Failed to add DNS name");
  }
}

export async function reserveDeviceIp(values: { id: string; hostname?: string }) {
  try {
    const { userId, email } = await requireManager();
    const hostname = values.hostname ? hostnameSchema.parse(values.hostname) : undefined;
    const device = await getDeviceOrThrow(userId, values.id);
    if (device.isUpstream || device.role !== "CLIENT") {
      return { success: false as const, error: "Only LAN client devices can get a DHCP reservation" };
    }
    const connection = await requireConnection(userId);

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: "dhcp-reservation",
        target: getDeviceDisplayName(device),
        deviceId: device.id,
        details: { ip: device.ipAddress, mac: device.macAddress, hostname: hostname ?? null },
      },
      () =>
        networkControlService.addDhcpReservation(connection, {
          hostname,
          ip: device.ipAddress,
          mac: device.macAddress,
          description: `home-hub: ${getDeviceDisplayName(device)}`,
        }),
    );
    return { success: true as const, ip: device.ipAddress };
  } catch (error) {
    return fail(error, "Failed to reserve IP");
  }
}

// --------------------------------------------------------------------- quota

const quotaSchema = z.object({
  id: z.string().min(1),
  // null clears the quota
  dailyQuotaMB: z.number().int().min(1).max(10_000_000).nullable(),
  quotaAction: z.enum(["alert", "block"]),
});

export async function setDeviceQuota(values: z.infer<typeof quotaSchema>) {
  try {
    const { userId, email } = await requireManager();
    const parsed = quotaSchema.parse(values);
    const device = await getDeviceOrThrow(userId, parsed.id);
    if (parsed.quotaAction === "block" && parsed.dailyQuotaMB) await requireMacMode(userId);

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: parsed.dailyQuotaMB ? "quota-set" : "quota-clear",
        target: getDeviceDisplayName(device),
        deviceId: device.id,
        details: parsed.dailyQuotaMB ? { dailyQuotaMB: parsed.dailyQuotaMB, action: parsed.quotaAction } : {},
      },
      async () => {
        await db.networkDevice.update({
          where: { id: device.id },
          data: {
            dailyQuotaMB: parsed.dailyQuotaMB,
            quotaAction: parsed.dailyQuotaMB ? parsed.quotaAction : null,
          },
        });
        await reconcileAccess(userId, { actorEmail: email, trigger: "quota" });
      },
    );
    return { success: true as const };
  } catch (error) {
    return fail(error, "Failed to set quota");
  }
}

// --------------------------------------------------------------------- audit

export async function getNetworkAuditLog(options: { deviceId?: string; limit?: number } = {}) {
  try {
    const { userId } = await getActor();
    const entries = await networkAuditService.list(userId, {
      deviceId: options.deviceId,
      limit: Math.min(options.limit ?? 100, 500),
    });
    return {
      success: true as const,
      data: entries.map((entry) => ({
        id: entry.id,
        at: entry.at.toISOString(),
        actor: entry.actorEmail ?? "Home Hub",
        action: entry.action,
        target: entry.target,
        deviceId: entry.deviceId,
        success: entry.success,
        error: entry.error,
        details: entry.details,
      })),
    };
  } catch (error) {
    return fail(error, "Failed to load audit log");
  }
}
