import type { TimeTopic, TimeSession } from "@/app/generated/prisma";

export type { TimeSession };

export interface TimeTopicWithSessions extends TimeTopic {
  sessions: TimeSession[];
  activeSession?: TimeSession;
}

// Hierarchical duration breakdown structures
export interface DayDuration {
  day: number; // Day of month (1-31)
  durationMs: number;
}

export interface MonthDuration {
  month: number; // Month (1-12)
  durationMs: number;
  durations: DayDuration[];
}

export interface YearDuration {
  year: number;
  durationMs: number;
  durations: MonthDuration[];
}

export interface DurationBreakdown {
  totalDurationMs: number;
  durations: YearDuration[];
}

export interface TimeTopicStats {
  sessionCount: number;
  lastTrackedAt: Date | null;
  durationBreakdown?: DurationBreakdown;
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
