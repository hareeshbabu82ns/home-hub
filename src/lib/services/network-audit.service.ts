import type { Prisma } from "@/app/generated/prisma";
import { db } from "@/lib/db";

export interface AuditEntryInput {
  userId: string;
  actorEmail?: string | null;
  action: string;
  target?: string;
  deviceId?: string;
  success: boolean;
  error?: string;
  details?: Prisma.InputJsonValue;
}

class NetworkAuditService {
  /** Never throws: an audit failure must not mask the action's own result. */
  async record(entry: AuditEntryInput) {
    try {
      await db.networkAuditLog.create({
        data: {
          userId: entry.userId,
          actorEmail: entry.actorEmail ?? null,
          action: entry.action,
          target: entry.target,
          deviceId: entry.deviceId,
          success: entry.success,
          error: entry.error,
          details: entry.details,
        },
      });
    } catch (error) {
      console.error("[audit] failed to record", entry.action, error);
    }
  }

  /** Runs `task`, recording success or failure; rethrows failures. */
  async track<T>(entry: Omit<AuditEntryInput, "success" | "error">, task: () => Promise<T>): Promise<T> {
    try {
      const result = await task();
      await this.record({ ...entry, success: true });
      return result;
    } catch (error) {
      await this.record({
        ...entry,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async list(userId: string, options: { deviceId?: string; limit?: number } = {}) {
    return db.networkAuditLog.findMany({
      where: { userId, ...(options.deviceId ? { deviceId: options.deviceId } : {}) },
      orderBy: { at: "desc" },
      take: options.limit ?? 100,
    });
  }
}

export const networkAuditService = new NetworkAuditService();
