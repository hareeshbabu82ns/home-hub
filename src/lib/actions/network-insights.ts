"use server";

import { ObjectId } from "mongodb";

import { getUserAuth } from "@/lib/auth/utils";
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
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const [status, history, topToday] = await Promise.all([
      networkInsightsService.getCollectorStatus(userId),
      networkInsightsService.getTrafficHistory(userId, window),
      networkInsightsService.getTopConsumers(userId, todayStart),
    ]);
    return { status, history, topToday };
  });
}

export async function getDeviceInsights(deviceId: string) {
  return withUser("Failed to load device history", async (userId) => {
    if (!ObjectId.isValid(deviceId)) throw new Error("Invalid device id");
    const device = await networkDeviceService.getById(userId, deviceId);
    if (!device) throw new Error("Device not found");
    const [usage, domains, presence] = await Promise.all([
      networkInsightsService.getDeviceUsage(userId, deviceId),
      networkInsightsService.getDeviceTopDomains(userId, deviceId),
      networkInsightsService.getDevicePresence(userId, deviceId),
    ]);
    return { usage, domains, presence };
  });
}

export async function getUsageToday() {
  return withUser("Failed to load usage", (userId) =>
    networkInsightsService.getUsageTodayByDevice(userId),
  );
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
