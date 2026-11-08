import { headers } from "next/headers";
import { z } from "zod";

import { getUserAuth } from "@/lib/auth/utils";
import { NetworkSafetyError } from "@/lib/services/network-device.service";
import { OpnsenseApiError } from "@/lib/services/opnsense-client";

/** Shared by the network server actions (which may only export actions). */

export const NOT_CONFIGURED = "Configure network API credentials in Settings first";

export class NetworkPermissionError extends Error {}

export async function getActor() {
  const { session } = await getUserAuth();
  if (!session) {
    throw new NetworkPermissionError("Unauthorized");
  }
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    canManage: session.user.role === "ADMIN",
  };
}

/** Network control (scan, block, edit, settings) is limited to admins. */
export async function requireManager() {
  const actor = await getActor();
  if (!actor.canManage) {
    throw new NetworkPermissionError("Only admins can change network settings or devices");
  }
  return actor;
}

/** User-facing message for known errors; logs and hides everything else. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Invalid input";
  }
  if (
    error instanceof NetworkPermissionError ||
    error instanceof NetworkSafetyError ||
    error instanceof OpnsenseApiError
  ) {
    return error.message;
  }
  if (error instanceof Error && /decrypt|NETWORK_SECRET_KEY|HH_Block/.test(error.message)) {
    return error.message;
  }
  console.error(fallback, error);
  return fallback;
}

export async function getRequesterIp(): Promise<string | null> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headerList.get("x-real-ip")?.trim() || null;
  return ip?.replace(/^::ffff:/, "") ?? null;
}
