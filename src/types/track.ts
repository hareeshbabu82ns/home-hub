import type {
  TrackItem,
  TrackAttributes,
  TrackAttributeValueType,
} from "@/app/generated/prisma";

export interface TrackItemWithAttributes extends TrackItem {
  TrackAttributes: TrackAttributes[];
}

export interface QuickEntryAttribute {
  title: string;
  valueType: TrackAttributeValueType;
  count: number;
  trackId: string;
  trackTitle: string;
  lastValue?: string;
  lastUsed: Date;
}

export interface TrackAttributeFormData {
  id?: string;
  trackId: string;
  title: string;
  value?: string;
  valueInt?: number;
  valueFloat?: number;
  valueDate?: Date;
  valueDuration?: number; // Duration in minutes
  valueType: TrackAttributeValueType;
  // Timer state
  timerStartTime?: Date;
  timerEndTime?: Date;
  isTimerRunning?: boolean;
}

export interface TimerState {
  id: string;
  isRunning: boolean;
  startTime?: Date;
  endTime?: Date;
  elapsedMs?: number; // Current elapsed time in milliseconds
}

export interface TrackAttributeFilter {
  attributeTitle?: string;
  valueType?: TrackAttributeValueType;
  minValue?: number;
  maxValue?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
}

export interface TrackItemFilter {
  title?: string;
  description?: string;
  dateFrom?: Date;
  dateTo?: Date;
  attributes?: TrackAttributeFilter;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  label?: string;
}

export interface TrackingMetrics {
  totalItems: number;
  totalAttributes: number;
  recentActivity: number;
  attributesByType: Record<TrackAttributeValueType, number>;
}
