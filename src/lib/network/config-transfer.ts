import { z } from "zod";

import { db } from "@/lib/db";
import { resolveTimeZone } from "@/lib/network/access-policy";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { GLOBAL_SCOPE, normalizeDomain } from "@/lib/network/site-filter";
import { isRandomMac, normaliseMac } from "@/lib/services/network-discovery";

/**
 * Network configuration backup: device labels and access settings, keyed by
 * MAC address so a file moves between Home Hub installs (or accounts) whose
 * database ids differ. Router credentials, traffic history and transient
 * state (pauses, online status) are never included.
 *
 * Import is planned first (`planImport`, no writes) so the UI can show what
 * will change; `applyImportPlan` then writes exactly that plan.
 */

export const EXPORT_FORMAT = "home-hub.network-config";
export const EXPORT_VERSION = 1;

const mac = z.string().transform((value, ctx) => {
  const normalized = normaliseMac(value);
  if (!normalized) {
    ctx.addIssue({ code: "custom", message: `"${value}" isn't a MAC address` });
    return z.NEVER;
  }
  return normalized;
});

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const deviceSchema = z.object({
  macAddress: mac,
  name: optionalText(80),
  deviceType: optionalText(80),
  notes: optionalText(500),
  isFavorite: z.boolean().nullable().optional(),
  blocked: z.boolean().nullable().optional(),
  dailyQuotaMB: z.number().int().min(1).max(10_000_000).nullable().optional(),
  quotaAction: z.enum(["alert", "block"]).nullable().optional(),
  // Informational; used only when a device has to be created.
  ipAddress: z.string().max(64).nullable().optional(),
  hostname: optionalText(120),
  dhcpHostname: optionalText(120),
  vendor: optionalText(80),
});

const scheduleSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    enabled: z.boolean().default(true),
    days: z.array(z.number().int().min(0).max(6)).min(1),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(0).max(1439),
    devices: z.array(mac).default([]),
  })
  .refine((value) => value.startMinute !== value.endMinute, {
    message: "Schedule start and end must differ",
  });

const siteRuleSchema = z.object({
  // "global" or a device MAC address
  scope: z.string().min(1),
  domain: z.string().min(1).max(300),
  action: z.enum(["block", "allow"]),
});

const settingsSchema = z.object({
  quarantineNewDevices: z.boolean().nullable().optional(),
  timezone: z.string().max(64).nullable().optional(),
  defaultSubnet: z.string().max(64).nullable().optional(),
  alertEmailEnabled: z.boolean().nullable().optional(),
  alertEmail: z.string().email().nullable().optional(),
  alertMinSeverity: z
    .enum(["info", "warning", "critical"])
    .nullable()
    .optional(),
});

export const networkConfigFileSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.string().optional(),
  settings: settingsSchema.optional(),
  devices: z.array(deviceSchema).max(5000).default([]),
  schedules: z.array(scheduleSchema).max(500).default([]),
  siteRules: z.array(siteRuleSchema).max(20_000).default([]),
});

export type NetworkConfigFile = z.input<typeof networkConfigFileSchema>;
type ParsedFile = z.output<typeof networkConfigFileSchema>;

export const importOptionsSchema = z.object({
  sections: z
    .object({
      devices: z.boolean().default(true),
      schedules: z.boolean().default(true),
      siteRules: z.boolean().default(true),
      settings: z.boolean().default(true),
    })
    .default({
      devices: true,
      schedules: true,
      siteRules: true,
      settings: true,
    }),
  /** merge: add and update only. replace: also remove schedules/rules missing from the file. */
  mode: z.enum(["merge", "replace"]).default("merge"),
  /** Add devices from the file that this inventory hasn't seen yet. */
  createMissingDevices: z.boolean().default(true),
});

export type ImportOptions = z.input<typeof importOptionsSchema>;

// ------------------------------------------------------------------- export

export async function buildExport(userId: string) {
  const [settings, devices, schedules, rules] = await Promise.all([
    db.networkIntegrationSettings.findUnique({ where: { userId } }),
    db.networkDevice.findMany({
      where: { userId },
      orderBy: [{ role: "asc" }, { macAddress: "asc" }],
    }),
    db.networkAccessSchedule.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    db.networkSiteRule.findMany({
      where: { userId },
      orderBy: [{ scope: "asc" }, { domain: "asc" }],
    }),
  ]);
  const macById = new Map(
    devices.map((device) => [device.id, device.macAddress]),
  );

  const file: ParsedFile = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings: settings
      ? {
          quarantineNewDevices: settings.quarantineNewDevices ?? null,
          timezone: settings.timezone ?? null,
          defaultSubnet: settings.defaultSubnet ?? null,
          alertEmailEnabled: settings.alertEmailEnabled ?? null,
          alertEmail: settings.alertEmail ?? null,
          alertMinSeverity:
            (settings.alertMinSeverity as
              "info" | "warning" | "critical" | null) ?? null,
        }
      : undefined,
    devices: devices.map((device) => ({
      macAddress: device.macAddress,
      name: device.name ?? null,
      deviceType: device.deviceType ?? null,
      notes: device.notes ?? null,
      isFavorite: device.isFavorite ?? null,
      blocked: device.blocked ?? null,
      dailyQuotaMB: device.dailyQuotaMB ?? null,
      quotaAction: (device.quotaAction as "alert" | "block" | null) ?? null,
      ipAddress: device.ipAddress || null,
      hostname: device.hostname ?? null,
      dhcpHostname: device.dhcpHostname ?? null,
      vendor: device.vendor ?? null,
    })),
    schedules: schedules.map((schedule) => ({
      name: schedule.name,
      enabled: schedule.enabled,
      days: schedule.days,
      startMinute: schedule.startMinute,
      endMinute: schedule.endMinute,
      devices: schedule.deviceIds
        .map((id) => macById.get(id))
        .filter((value): value is string => !!value),
    })),
    siteRules: rules
      .map((rule) => ({
        scope:
          rule.scope === GLOBAL_SCOPE ? GLOBAL_SCOPE : macById.get(rule.scope),
        domain: rule.domain,
        action: rule.action as "block" | "allow",
      }))
      .filter(
        (
          rule,
        ): rule is {
          scope: string;
          domain: string;
          action: "block" | "allow";
        } => !!rule.scope,
      ),
  };
  return file;
}

// ------------------------------------------------------------------- import

const DEVICE_FIELDS = [
  "name",
  "deviceType",
  "notes",
  "isFavorite",
  "blocked",
  "dailyQuotaMB",
  "quotaAction",
] as const;
type DeviceField = (typeof DEVICE_FIELDS)[number];
type DevicePatch = Partial<
  Record<DeviceField, string | number | boolean | null>
>;

export interface ImportPlan {
  options: z.output<typeof importOptionsSchema>;
  devices: {
    create: Array<{
      macAddress: string;
      label: string;
      data: DevicePatch & {
        ipAddress: string;
        hostname: string | null;
        dhcpHostname: string | null;
        vendor: string | null;
      };
    }>;
    update: Array<{ id: string; label: string; changes: DevicePatch }>;
    unchanged: number;
  };
  schedules: {
    create: Array<{ name: string; data: ScheduleData }>;
    update: Array<{ id: string; name: string; data: ScheduleData }>;
    remove: Array<{ id: string; name: string }>;
    unchanged: number;
  };
  siteRules: {
    add: Array<{
      scopeMac: string;
      domain: string;
      action: "block" | "allow";
      replaceId?: string;
    }>;
    remove: Array<{ id: string; domain: string }>;
    unchanged: number;
  };
  settings: { changes: Record<string, unknown> };
  warnings: string[];
  /** Devices the import would block that look like the requester's own. */
  selfBlock: string[];
  accessChanged: boolean;
  siteRulesChanged: boolean;
}

interface ScheduleData {
  name: string;
  enabled: boolean;
  days: number[];
  startMinute: number;
  endMinute: number;
  /** Device MACs; resolved to ids when applied (new devices get ids then). */
  macs: string[];
}

export function summarizePlan(plan: ImportPlan) {
  return {
    devices: {
      create: plan.devices.create.map((device) => device.label),
      update: plan.devices.update.map((device) => ({
        label: device.label,
        fields: Object.keys(device.changes),
      })),
      unchanged: plan.devices.unchanged,
    },
    schedules: {
      create: plan.schedules.create.map((schedule) => schedule.name),
      update: plan.schedules.update.map((schedule) => schedule.name),
      remove: plan.schedules.remove.map((schedule) => schedule.name),
      unchanged: plan.schedules.unchanged,
    },
    siteRules: {
      add: plan.siteRules.add.map((rule) => `${rule.action} ${rule.domain}`),
      remove: plan.siteRules.remove.map((rule) => rule.domain),
      unchanged: plan.siteRules.unchanged,
    },
    settings: Object.keys(plan.settings.changes),
    warnings: plan.warnings,
    selfBlock: plan.selfBlock,
    hasChanges:
      plan.devices.create.length +
        plan.devices.update.length +
        plan.schedules.create.length +
        plan.schedules.update.length +
        plan.schedules.remove.length +
        plan.siteRules.add.length +
        plan.siteRules.remove.length +
        Object.keys(plan.settings.changes).length >
      0,
  };
}

export type ImportSummary = ReturnType<typeof summarizePlan>;

/** Parses JSON text into a validated file; throws with a readable message. */
export function parseConfigFile(text: string): ParsedFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("The file isn't valid JSON");
  }
  if (
    typeof raw === "object" &&
    raw &&
    (raw as { format?: unknown }).format !== EXPORT_FORMAT
  ) {
    throw new Error("This isn't a Home Hub network export");
  }
  const parsed = networkConfigFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid file at ${issue?.path.join(".") || "root"}: ${issue?.message ?? "unknown error"}`,
    );
  }
  return parsed.data;
}

const sameList = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

export async function planImport(
  userId: string,
  file: ParsedFile,
  rawOptions: ImportOptions,
  requesterIp: string | null,
): Promise<ImportPlan> {
  const options = importOptionsSchema.parse(rawOptions);
  const { sections } = options;

  const [settings, devices, schedules, rules] = await Promise.all([
    db.networkIntegrationSettings.findUnique({ where: { userId } }),
    db.networkDevice.findMany({ where: { userId } }),
    db.networkAccessSchedule.findMany({ where: { userId } }),
    db.networkSiteRule.findMany({ where: { userId } }),
  ]);
  const macMode = settings?.controlMode === "mac";

  const plan: ImportPlan = {
    options,
    devices: { create: [], update: [], unchanged: 0 },
    schedules: { create: [], update: [], remove: [], unchanged: 0 },
    siteRules: { add: [], remove: [], unchanged: 0 },
    settings: { changes: {} },
    warnings: [],
    selfBlock: [],
    accessChanged: false,
    siteRulesChanged: false,
  };

  const byMac = new Map(devices.map((device) => [device.macAddress, device]));
  const idToMac = new Map(
    devices.map((device) => [device.id, device.macAddress]),
  );
  // MACs that will exist after the import (existing + created).
  const knownMacs = new Set(byMac.keys());
  const controllable = (macAddress: string) => {
    const device = byMac.get(macAddress);
    return !device || (device.role === "CLIENT" && !device.isUpstream);
  };

  // Devices -----------------------------------------------------------------
  const seen = new Set<string>();
  let skippedBlocked = 0;
  for (const entry of sections.devices ? file.devices : []) {
    if (seen.has(entry.macAddress)) continue;
    seen.add(entry.macAddress);
    const existing = byMac.get(entry.macAddress);

    const patch: DevicePatch = {};
    for (const field of DEVICE_FIELDS) {
      const value = entry[field];
      if (value !== undefined) patch[field] = value === "" ? null : value;
    }
    const canControl = controllable(entry.macAddress);
    if ("blocked" in patch && (!macMode || !canControl)) {
      if (patch.blocked) skippedBlocked++;
      delete patch.blocked;
    }
    if (!canControl) {
      delete patch.dailyQuotaMB;
      delete patch.quotaAction;
    }

    if (!existing) {
      if (!options.createMissingDevices) continue;
      knownMacs.add(entry.macAddress);
      plan.devices.create.push({
        macAddress: entry.macAddress,
        label:
          entry.name ||
          entry.dhcpHostname ||
          entry.hostname ||
          entry.macAddress,
        data: {
          ...patch,
          ipAddress: entry.ipAddress ?? "",
          hostname: entry.hostname ?? null,
          dhcpHostname: entry.dhcpHostname ?? null,
          vendor: entry.vendor ?? null,
        },
      });
      if (patch.blocked || patch.dailyQuotaMB) plan.accessChanged = true;
      continue;
    }

    const changes: DevicePatch = {};
    for (const [field, value] of Object.entries(patch) as [
      DeviceField,
      DevicePatch[DeviceField],
    ][]) {
      if ((existing[field] ?? null) !== value) changes[field] = value;
    }
    if (Object.keys(changes).length === 0) {
      plan.devices.unchanged++;
      continue;
    }
    plan.devices.update.push({
      id: existing.id,
      label: getDeviceDisplayName(existing),
      changes,
    });
    if (
      "blocked" in changes ||
      "dailyQuotaMB" in changes ||
      "quotaAction" in changes
    )
      plan.accessChanged = true;
    if (
      changes.blocked === true &&
      requesterIp &&
      existing.ipAddress === requesterIp
    ) {
      plan.selfBlock.push(getDeviceDisplayName(existing));
    }
  }
  if (skippedBlocked > 0) {
    plan.warnings.push(
      macMode
        ? `${skippedBlocked} blocked device(s) are routers or WAN-side and were left unblocked.`
        : `Blocked state for ${skippedBlocked} device(s) was skipped: prepare the router (Settings → Network → Router control) first, then import again.`,
    );
  }

  // Schedules ---------------------------------------------------------------
  if (sections.schedules) {
    const existingByName = new Map(
      schedules.map((schedule) => [schedule.name.toLowerCase(), schedule]),
    );
    const inFile = new Set<string>();
    let droppedDevices = 0;
    for (const entry of file.schedules) {
      const key = entry.name.toLowerCase();
      if (inFile.has(key)) continue;
      inFile.add(key);
      const macs = [...new Set(entry.devices)].filter((macAddress) => {
        const ok = knownMacs.has(macAddress) && controllable(macAddress);
        if (!ok) droppedDevices++;
        return ok;
      });
      const data: ScheduleData = {
        name: entry.name,
        enabled: entry.enabled,
        days: [...new Set(entry.days)].sort(),
        startMinute: entry.startMinute,
        endMinute: entry.endMinute,
        macs: macs.sort(),
      };
      const existing = existingByName.get(key);
      if (!existing) {
        plan.schedules.create.push({ name: entry.name, data });
        continue;
      }
      const currentMacs = existing.deviceIds
        .map((id) => idToMac.get(id))
        .filter((m): m is string => !!m)
        .sort();
      const same =
        existing.enabled === data.enabled &&
        sameList([...existing.days].sort(), data.days) &&
        existing.startMinute === data.startMinute &&
        existing.endMinute === data.endMinute &&
        sameList(currentMacs, data.macs);
      if (same) plan.schedules.unchanged++;
      else
        plan.schedules.update.push({
          id: existing.id,
          name: existing.name,
          data,
        });
    }
    if (options.mode === "replace") {
      for (const schedule of schedules) {
        if (!inFile.has(schedule.name.toLowerCase()))
          plan.schedules.remove.push({ id: schedule.id, name: schedule.name });
      }
    }
    if (droppedDevices > 0) {
      plan.warnings.push(
        `${droppedDevices} schedule device(s) aren't in this inventory (or can't be controlled) and were left out.`,
      );
    }
    if (
      !macMode &&
      (plan.schedules.create.length || plan.schedules.update.length)
    ) {
      plan.warnings.push(
        "Schedules are saved but only enforced once the router is prepared for MAC control.",
      );
    }
    if (
      plan.schedules.create.length ||
      plan.schedules.update.length ||
      plan.schedules.remove.length
    ) {
      plan.accessChanged = true;
    }
  }

  // Website rules -----------------------------------------------------------
  if (sections.siteRules) {
    const existingByKey = new Map(
      rules.map((rule) => [
        `${rule.scope === GLOBAL_SCOPE ? GLOBAL_SCOPE : idToMac.get(rule.scope)}|${rule.domain}`,
        rule,
      ]),
    );
    const inFile = new Set<string>();
    let invalid = 0;
    for (const entry of file.siteRules) {
      const domain = normalizeDomain(entry.domain);
      const scope =
        entry.scope === GLOBAL_SCOPE ? GLOBAL_SCOPE : normaliseMac(entry.scope);
      if (
        !domain ||
        !scope ||
        (scope === GLOBAL_SCOPE && entry.action === "allow") ||
        (scope !== GLOBAL_SCOPE &&
          (!knownMacs.has(scope) || !controllable(scope)))
      ) {
        invalid++;
        continue;
      }
      const key = `${scope}|${domain}`;
      if (inFile.has(key)) continue;
      inFile.add(key);
      const existing = existingByKey.get(key);
      if (existing?.action === entry.action) {
        plan.siteRules.unchanged++;
      } else {
        plan.siteRules.add.push({
          scopeMac: scope,
          domain,
          action: entry.action,
          replaceId: existing?.id,
        });
      }
    }
    if (options.mode === "replace") {
      for (const [key, rule] of existingByKey) {
        if (!inFile.has(key))
          plan.siteRules.remove.push({ id: rule.id, domain: rule.domain });
      }
    }
    if (invalid > 0)
      plan.warnings.push(
        `${invalid} website rule(s) were skipped (bad domain, unknown device, or a global "allow").`,
      );
    if (
      !settings &&
      (plan.siteRules.add.length || plan.siteRules.remove.length)
    ) {
      plan.warnings.push(
        "Website rules are saved but only reach the router once router credentials are set.",
      );
    }
    plan.siteRulesChanged =
      plan.siteRules.add.length + plan.siteRules.remove.length > 0;
  }

  // Settings ----------------------------------------------------------------
  if (sections.settings && file.settings) {
    if (!settings) {
      plan.warnings.push(
        "Network settings were skipped: enter the router credentials first (Settings → Network).",
      );
    } else {
      const incoming = { ...file.settings };
      if (
        incoming.timezone &&
        resolveTimeZone(incoming.timezone) !== incoming.timezone
      ) {
        plan.warnings.push(
          `Unknown timezone "${incoming.timezone}" was skipped.`,
        );
        delete incoming.timezone;
      }
      if (incoming.quarantineNewDevices && !macMode) {
        plan.warnings.push(
          "Quarantine for new devices was skipped: it needs the router prepared for MAC control.",
        );
        delete incoming.quarantineNewDevices;
      }
      for (const [key, value] of Object.entries(incoming)) {
        if (value === undefined) continue;
        if ((settings[key as keyof typeof settings] ?? null) !== value)
          plan.settings.changes[key] = value;
      }
      if (
        "quarantineNewDevices" in plan.settings.changes ||
        "timezone" in plan.settings.changes
      )
        plan.accessChanged = true;
    }
  }

  return plan;
}

/** Writes a plan. Callers audit and then reconcile / sync the router. */
export async function applyImportPlan(userId: string, plan: ImportPlan) {
  for (const device of plan.devices.create) {
    const { macAddress, data } = device;
    await db.networkDevice.create({
      data: {
        userId,
        macAddress,
        ipAddress: data.ipAddress,
        hostname: data.hostname,
        dhcpHostname: data.dhcpHostname,
        vendor: data.vendor,
        name: (data.name as string | null | undefined) ?? null,
        deviceType: (data.deviceType as string | null | undefined) ?? null,
        notes: (data.notes as string | null | undefined) ?? null,
        isFavorite: (data.isFavorite as boolean | null | undefined) ?? null,
        blocked: (data.blocked as boolean | null | undefined) ?? null,
        dailyQuotaMB: (data.dailyQuotaMB as number | null | undefined) ?? null,
        quotaAction: (data.quotaAction as string | null | undefined) ?? null,
        pausedUntil: null,
        allowedUntil: null,
        isRandomMac: isRandomMac(macAddress),
        isOnline: false,
        // Imported devices were already reviewed elsewhere; don't quarantine them.
        isNew: false,
        intf: null,
        intfDescription: null,
      },
    });
  }

  for (const device of plan.devices.update) {
    await db.networkDevice.update({
      where: { id: device.id },
      data: device.changes as Parameters<
        typeof db.networkDevice.update
      >[0]["data"],
    });
  }

  if (plan.schedules.create.length || plan.schedules.update.length) {
    const devices = await db.networkDevice.findMany({
      where: { userId },
      select: { id: true, macAddress: true },
    });
    const idByMac = new Map(
      devices.map((device) => [device.macAddress, device.id]),
    );
    const toData = ({ macs, ...rest }: ScheduleData) => ({
      ...rest,
      deviceIds: macs
        .map((macAddress) => idByMac.get(macAddress))
        .filter((id): id is string => !!id),
    });
    for (const schedule of plan.schedules.create) {
      await db.networkAccessSchedule.create({
        data: { userId, ...toData(schedule.data) },
      });
    }
    for (const schedule of plan.schedules.update) {
      await db.networkAccessSchedule.update({
        where: { id: schedule.id },
        data: toData(schedule.data),
      });
    }
  }
  if (plan.schedules.remove.length) {
    await db.networkAccessSchedule.deleteMany({
      where: { userId, id: { in: plan.schedules.remove.map((s) => s.id) } },
    });
  }

  if (plan.siteRules.add.length || plan.siteRules.remove.length) {
    const devices = await db.networkDevice.findMany({
      where: { userId },
      select: { id: true, macAddress: true },
    });
    const idByMac = new Map(
      devices.map((device) => [device.macAddress, device.id]),
    );
    const replaced = plan.siteRules.add
      .map((rule) => rule.replaceId)
      .filter((id): id is string => !!id);
    const removed = [
      ...plan.siteRules.remove.map((rule) => rule.id),
      ...replaced,
    ];
    if (removed.length)
      await db.networkSiteRule.deleteMany({
        where: { userId, id: { in: removed } },
      });
    for (const rule of plan.siteRules.add) {
      const scope =
        rule.scopeMac === GLOBAL_SCOPE
          ? GLOBAL_SCOPE
          : idByMac.get(rule.scopeMac);
      if (!scope) continue;
      await db.networkSiteRule.create({
        data: {
          userId,
          scope,
          domain: rule.domain,
          action: rule.action,
          createdBy: "import",
        },
      });
    }
  }

  if (Object.keys(plan.settings.changes).length) {
    await db.networkIntegrationSettings.update({
      where: { userId },
      data: plan.settings.changes as Parameters<
        typeof db.networkIntegrationSettings.update
      >[0]["data"],
    });
  }
}
