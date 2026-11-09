"use server";

import { z } from "zod";

import {
  errorMessage,
  getActor,
  getRequesterIp,
  requireManager,
} from "@/lib/network/action-helpers";
import {
  applyImportPlan,
  buildExport,
  importOptionsSchema,
  parseConfigFile,
  planImport,
  summarizePlan,
  type ImportOptions,
} from "@/lib/network/config-transfer";
import { reconcileAccess } from "@/lib/network/enforcement";
import { syncSiteFilter } from "@/lib/network/site-filter";
import { networkAuditService } from "@/lib/services/network-audit.service";

/** Network config backup/restore: devices, schedules, website rules, settings. */

const MAX_FILE_CHARS = 5_000_000;

function fail(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    /^(The file|This isn't|Invalid file)/.test(error.message)
  ) {
    return { success: false as const, error: error.message };
  }
  return { success: false as const, error: errorMessage(error, fallback) };
}

export async function exportNetworkConfig() {
  try {
    const { userId } = await getActor();
    const file = await buildExport(userId);
    return {
      success: true as const,
      json: JSON.stringify(file, null, 2),
      counts: {
        devices: file.devices.length,
        schedules: file.schedules.length,
        siteRules: file.siteRules.length,
      },
    };
  } catch (error) {
    return fail(error, "Failed to export network configuration");
  }
}

const textSchema = z
  .string()
  .min(2, "The file is empty")
  .max(MAX_FILE_CHARS, "The file is too large");

/** Dry run: what an import would change. Nothing is written. */
export async function previewNetworkImport(
  text: string,
  options: ImportOptions,
) {
  try {
    const { userId } = await requireManager();
    const file = parseConfigFile(textSchema.parse(text));
    const plan = await planImport(
      userId,
      file,
      importOptionsSchema.parse(options),
      await getRequesterIp(),
    );
    return { success: true as const, summary: summarizePlan(plan) };
  } catch (error) {
    return fail(error, "Failed to read the import file");
  }
}

export async function applyNetworkImport(
  text: string,
  options: ImportOptions,
  confirmSelf = false,
) {
  try {
    const { userId, email } = await requireManager();
    const file = parseConfigFile(textSchema.parse(text));
    // Re-planned against current data: the preview may be stale.
    const plan = await planImport(
      userId,
      file,
      importOptionsSchema.parse(options),
      await getRequesterIp(),
    );
    const summary = summarizePlan(plan);
    if (!summary.hasChanges)
      return { success: true as const, summary, notice: "Nothing to change" };
    if (plan.selfBlock.length && !confirmSelf) {
      return {
        success: false as const,
        requiresConfirmation: true,
        error: `This import blocks ${plan.selfBlock.join(", ")}, which looks like the device you're using right now.`,
      };
    }

    await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: "config-import",
        target: `${plan.options.mode} import`,
        details: {
          devicesCreated: plan.devices.create.length,
          devicesUpdated: plan.devices.update.length,
          schedulesCreated: plan.schedules.create.length,
          schedulesUpdated: plan.schedules.update.length,
          schedulesRemoved: plan.schedules.remove.length,
          siteRulesAdded: plan.siteRules.add.length,
          siteRulesRemoved: plan.siteRules.remove.length,
          settings: Object.keys(plan.settings.changes),
          exportedAt: file.exportedAt ?? null,
        },
      },
      () => applyImportPlan(userId, plan),
    );

    const notices: string[] = [];
    if (plan.accessChanged) {
      const result = await reconcileAccess(userId, {
        actorEmail: email,
        trigger: "import",
      });
      if (result?.errors.length)
        notices.push(
          `Router access update failed: ${result.errors.join("; ")}`,
        );
    }
    if (plan.siteRulesChanged) {
      // One rebuild for the whole import; it takes about a minute on the
      // router, so don't hold the request. Status shows on the Websites page.
      void syncSiteFilter(userId, {
        actorEmail: email,
        trigger: "import",
      }).catch((error) =>
        console.error("[network-import] site filter sync failed", error),
      );
      notices.push(
        "Website rules are being applied on the router (about a minute).",
      );
    }
    return {
      success: true as const,
      summary,
      notice: notices.join(" ") || undefined,
    };
  } catch (error) {
    return fail(error, "Failed to import network configuration");
  }
}
