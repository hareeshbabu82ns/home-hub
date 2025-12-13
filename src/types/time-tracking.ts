import type { TimeTopic, TimeSession } from "@/app/generated/prisma";

export interface TimeTopicWithSessions extends TimeTopic {
  sessions: TimeSession[];
  activeSession?: TimeSession;
}

export interface TimeTopicStats {
  totalDurationMs: bigint;
  todayDurationMs: bigint;
  weekDurationMs: bigint;
  monthDurationMs: bigint;
  sessionCount: number;
  lastTrackedAt: Date | null;
}

export interface ClientTimerState {
  topicId: string;
  isRunning: boolean;
  startTime: number; // Unix timestamp ms
  elapsedMs: number;
  sessionId?: string;
}

export interface TimeTrackingState {
  topics: TimeTopicWithSessions[];
  activeTimers: Map<string, ClientTimerState>;
  lastSyncedAt: number;
}

// Color palette for topics
export const TOPIC_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
] as const;

// Icon options for topics
export const TOPIC_ICONS = [
  "Clock",
  "Code",
  "Book",
  "Briefcase",
  "Coffee",
  "Dumbbell",
  "Gamepad2",
  "GraduationCap",
  "Heart",
  "Home",
  "Laptop",
  "Music",
  "Palette",
  "Pencil",
  "Phone",
  "Plane",
  "ShoppingCart",
  "Star",
  "Target",
  "Users",
] as const;

export type TopicIconName = (typeof TOPIC_ICONS)[number];
