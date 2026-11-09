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
  { name: "Purple", value: "#a855f7" },
  { name: "Lime", value: "#84cc16" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Yellow", value: "#eab308" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Red", value: "#ef4444" },
  { name: "Gray", value: "#6b7280" },
  { name: "Brown", value: "#a0522d" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Silver", value: "#c0c0c0" },
  { name: "Gold", value: "#ffd700" },
  { name: "Bronze", value: "#cd7f32" },
  { name: "Copper", value: "#b87333" },
  { name: "Teal Dark", value: "#014d4d" },
  { name: "Navy", value: "#000080" },
  { name: "Olive", value: "#808000" },
  { name: "Maroon", value: "#800000" },
  { name: "Magenta", value: "#ff00ff" },
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
  "Video",
  "Wrench",
  "Activity",
  "Album",
  "Anchor",
  "Apple",
  "Archive",
  "Award",
  "Baby",
  "Bell",
  "Bluetooth",
  "Camera",
  "Car",
  "Cloud",
  "Crown",
  "Database",
  "Disc",
  "Eye",
  "Feather",
  "Flag",
  "Globe",
  "Hammer",
  "Headphones",
  "Leaf",
  "Lightbulb",
  "Lock",
  "Magnet",
  "Moon",
  "Paperclip",
  "PieChart",
  "Rocket",
  "Scissors",
  "Shield",
  "Sun",
  "Thermometer",
  "Trash2",
  "Truck",
  "Umbrella",
  "Wifi",
  "Zap",
] as const;

export type TopicIconName = (typeof TOPIC_ICONS)[number];
