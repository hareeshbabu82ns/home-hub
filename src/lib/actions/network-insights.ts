"use server";

import { ObjectId } from "mongodb";

import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { resolveTimeZone, startOfLocalDay } from "@/lib/network/access-policy";
import { getDeviceHistory, isDateString } from "@/lib/network/device-history";
import { getUsageSinceLocalMidnight } from "@/lib/network/enforcement";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { networkDeviceService } from "@/lib/services";
import { networkInsightsService } from "@/lib/services/network-insights.service";

/** Read-only views over collector data; any signed-in user may read their own. */

type Result<T> = { success: true; data: T } | { success: false; error: string };

async function withUser<T>(
  fallback: string,
  task: (userId: string) => Promise<T>,
): Promise<Result<T>> {
  try {
    const { session } = await getUserAuth();
    if (!session) return { success: false, error: "Unauthorized" };
    return { success: true, data: await task(session.user.id) };
  } catch (error) {
    console.error(fallback, error);
    return { success: false, error: fallback };
  }
}

const HISTORY_WINDOWS = new Set([1, 5, 15, 60]);

export async function getTrafficOverview(minutes: number) {
  return withUser("Failed to load traffic history", async (userId) => {
    const window = HISTORY_WINDOWS.has(minutes) ? minutes : 5;
    const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
    // Local day, matching quotas and the devices list.
    const todayStart = startOfLocalDay(new Date(), resolveTimeZone(settings?.timezone));
    todayStart.setMinutes(0, 0, 0);
    const [status, history, topToday, favoriteDevices] = await Promise.all([
      networkInsightsService.getCollectorStatus(userId),
      networkInsightsService.getTrafficHistory(userId, window),
      networkInsightsService.getTopConsumers(userId, todayStart),
      db.networkDevice.findMany({ where: { userId, isFavorite: true } }),
    ]);
    const usage = favoriteDevices.length
      ? await getUsageSinceLocalMidnight(userId, resolveTimeZone(settings?.timezone))
      : {};
    const favorites = favoriteDevices
      .map((device) => ({
        deviceId: device.id,
        name: getDeviceDisplayName(device),
        ipAddress: device.ipAddress,
        isOnline: device.isOnline,
        bytesToday: usage[device.id] ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { status, history, topToday, favorites };
  });
}

/** One local day (default today) of a device's history, plus the 30 days before it. */
export async function getDeviceInsights(deviceId: string, date?: string) {
  return withUser("Failed to load device history", async (userId) => {
    if (!ObjectId.isValid(deviceId)) throw new Error("Invalid device id");
    const device = await networkDeviceService.getById(userId, deviceId);
    if (!device) throw new Error("Device not found");
    const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
    return getDeviceHistory(
      userId,
      deviceId,
      resolveTimeZone(settings?.timezone),
      isDateString(date) ? date : undefined,
    );
  });
}

/** deviceId → estimated bytes since local midnight (same day as quotas). */
export async function getUsageToday() {
  return withUser("Failed to load usage", async (userId) => {
    const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
    return getUsageSinceLocalMidnight(userId, resolveTimeZone(settings?.timezone));
  });
}

export async function getRouterHealth(hours: number) {
  return withUser("Failed to load router health", async (userId) => {
    const [status, report] = await Promise.all([
      networkInsightsService.getCollectorStatus(userId),
      networkInsightsService.getRouterHealth(userId, hours === 6 ? 6 : 24),
    ]);
    return { status, report };
  });
}
