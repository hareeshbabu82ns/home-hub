"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from "date-fns";
import type { TimeTopicWithSessions } from "@/types/time-tracking";

// ============================================
// Topic Actions
// ============================================

export async function fetchTimeTopics(): Promise<TimeTopicWithSessions[]> {
  const { session } = await getUserAuth();
  if (!session) return [];

  const topics = await db.timeTopic.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
    },
    include: {
      sessions: {
        where: { isRunning: true },
        take: 1,
      },
    },
    orderBy: [{ isFavorite: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return topics.map((topic) => ({
    ...topic,
    activeSession: topic.sessions[0] || undefined,
  }));
}

export async function fetchTimeTopic(id: string) {
  const { session } = await getUserAuth();
  if (!session) return null;

  return db.timeTopic.findFirst({
    where: { id, userId: session.user.id },
    include: {
      sessions: {
        orderBy: { startTime: "desc" },
        take: 50,
      },
    },
  });
}

export async function createTimeTopic(
  _prevState: { message: string; success?: boolean },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Not authenticated", success: false };
  }

  const schema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon: z.string().optional(),
  });

  const parse = schema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || "#6366f1",
    icon: formData.get("icon") || undefined,
  });

  if (!parse.success) {
    return { message: "Invalid input", success: false };
  }

  try {
    const maxOrder = await db.timeTopic.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    });

    await db.timeTopic.create({
      data: {
        ...parse.data,
        userId: session.user.id,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    revalidatePath("/time-tracking");
    return { message: `Created topic "${parse.data.name}"`, success: true };
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return { message: "Topic with this name already exists", success: false };
    }
    console.error("Error creating topic:", error);
    return { message: "Failed to create topic", success: false };
  }
}

export async function updateTimeTopic(
  _prevState: { message: string; success?: boolean },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Not authenticated", success: false };
  }

  const schema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(50).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    icon: z.string().optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  });

  const rawData: Record<string, unknown> = {
    id: formData.get("id"),
  };

  if (formData.has("name")) rawData.name = formData.get("name");
  if (formData.has("color")) rawData.color = formData.get("color");
  if (formData.has("icon")) rawData.icon = formData.get("icon");
  if (formData.has("isFavorite"))
    rawData.isFavorite = formData.get("isFavorite") === "true";
  if (formData.has("isArchived"))
    rawData.isArchived = formData.get("isArchived") === "true";

  const parse = schema.safeParse(rawData);

  if (!parse.success) {
    return { message: "Invalid input", success: false };
  }

  const { id, ...updateData } = parse.data;

  try {
    await db.timeTopic.update({
      where: { id, userId: session.user.id },
      data: updateData,
    });

    revalidatePath("/time-tracking");
    return { message: "Topic updated", success: true };
  } catch (error) {
    console.error("Error updating topic:", error);
    return { message: "Failed to update topic", success: false };
  }
}

export async function deleteTimeTopic(
  _prevState: { message: string; success?: boolean },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Not authenticated", success: false };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { message: "Topic ID required", success: false };
  }

  try {
    await db.timeTopic.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/time-tracking");
    return { message: "Topic deleted", success: true };
  } catch (error) {
    console.error("Error deleting topic:", error);
    return { message: "Failed to delete topic", success: false };
  }
}

// ============================================
// Timer Actions
// ============================================

export async function startTopicTimer(
  _prevState: { message: string; success?: boolean; sessionId?: string },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Not authenticated", success: false };
  }

  const topicId = formData.get("topicId") as string;
  if (!topicId) {
    return { message: "Topic ID required", success: false };
  }

  try {
    // Check for existing running session
    const existingSession = await db.timeSession.findFirst({
      where: {
        userId: session.user.id,
        topicId,
        isRunning: true,
      },
    });

    if (existingSession) {
      return {
        message: "Timer already running",
        success: false,
        sessionId: existingSession.id,
      };
    }

    // Create new session
    const newSession = await db.timeSession.create({
      data: {
        userId: session.user.id,
        topicId,
        startTime: new Date(),
        isRunning: true,
      },
    });

    revalidatePath("/time-tracking");
    return {
      message: "Timer started",
      success: true,
      sessionId: newSession.id,
    };
  } catch (error) {
    console.error("Error starting timer:", error);
    return { message: "Failed to start timer", success: false };
  }
}

export async function stopTopicTimer(
  _prevState: { message: string; success?: boolean; durationMs?: number },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Not authenticated", success: false };
  }

  const topicId = formData.get("topicId") as string;
  const sessionId = formData.get("sessionId") as string;

  if (!topicId && !sessionId) {
    return { message: "Topic ID or Session ID required", success: false };
  }

  try {
    // Find running session
    const runningSession = await db.timeSession.findFirst({
      where: {
        userId: session.user.id,
        ...(sessionId ? { id: sessionId } : { topicId }),
        isRunning: true,
      },
    });

    if (!runningSession) {
      return { message: "No running timer found", success: false };
    }

    // Calculate duration
    const endTime = new Date();
    const durationMs = BigInt(
      endTime.getTime() - runningSession.startTime.getTime(),
    );

    // Update session
    await db.timeSession.update({
      where: { id: runningSession.id },
      data: {
        endTime,
        durationMs,
        isRunning: false,
      },
    });

    // Recalculate and update topic statistics
    await recalculateTopicStats(runningSession.topicId, session.user.id);

    revalidatePath("/time-tracking");
    return {
      message: `Timer stopped: ${formatDuration(Number(durationMs))}`,
      success: true,
      durationMs: Number(durationMs),
    };
  } catch (error) {
    console.error("Error stopping timer:", error);
    return { message: "Failed to stop timer", success: false };
  }
}

// ============================================
// Statistics Recalculation
// ============================================

async function recalculateTopicStats(topicId: string, userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const monthStart = startOfMonth(now);
  const todayEnd = endOfDay(now);

  // Get all completed sessions for this topic
  const allSessions = await db.timeSession.findMany({
    where: {
      topicId,
      userId,
      isRunning: false,
      durationMs: { not: null },
    },
  });

  // Calculate totals
  let totalDurationMs = BigInt(0);
  let todayDurationMs = BigInt(0);
  let weekDurationMs = BigInt(0);
  let monthDurationMs = BigInt(0);
  let lastTrackedAt: Date | null = null;

  for (const sess of allSessions) {
    const duration = sess.durationMs || BigInt(0);
    totalDurationMs += duration;

    if (sess.startTime >= todayStart && sess.startTime <= todayEnd) {
      todayDurationMs += duration;
    }
    if (sess.startTime >= weekStart) {
      weekDurationMs += duration;
    }
    if (sess.startTime >= monthStart) {
      monthDurationMs += duration;
    }

    if (!lastTrackedAt || sess.endTime! > lastTrackedAt) {
      lastTrackedAt = sess.endTime!;
    }
  }

  // Update topic with cached stats
  await db.timeTopic.update({
    where: { id: topicId },
    data: {
      totalDurationMs,
      todayDurationMs,
      weekDurationMs,
      monthDurationMs,
      sessionCount: allSessions.length,
      lastTrackedAt,
    },
  });
}

export async function refreshAllTopicStats() {
  const { session } = await getUserAuth();
  if (!session) return;

  const topics = await db.timeTopic.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  for (const topic of topics) {
    await recalculateTopicStats(topic.id, session.user.id);
  }

  revalidatePath("/time-tracking");
}

// ============================================
// Session History
// ============================================

export async function fetchTopicSessions(topicId: string, limit: number = 50) {
  const { session } = await getUserAuth();
  if (!session) return [];

  return db.timeSession.findMany({
    where: {
      topicId,
      userId: session.user.id,
    },
    orderBy: { startTime: "desc" },
    take: limit,
  });
}

export async function deleteTimeSession(
  _prevState: { message: string; success?: boolean },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Not authenticated", success: false };
  }

  const sessionId = formData.get("sessionId") as string;
  if (!sessionId) {
    return { message: "Session ID required", success: false };
  }

  try {
    const timeSession = await db.timeSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!timeSession) {
      return { message: "Session not found", success: false };
    }

    await db.timeSession.delete({
      where: { id: sessionId },
    });

    // Recalculate stats after deletion
    await recalculateTopicStats(timeSession.topicId, session.user.id);

    revalidatePath("/time-tracking");
    return { message: "Session deleted", success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { message: "Failed to delete session", success: false };
  }
}

// ============================================
// Utility Functions
// ============================================

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Get running timers for client-side sync
export async function getRunningTimers() {
  const { session } = await getUserAuth();
  if (!session) return [];

  return db.timeSession.findMany({
    where: {
      userId: session.user.id,
      isRunning: true,
    },
    include: {
      topic: {
        select: { id: true, name: true, color: true, icon: true },
      },
    },
  });
}
