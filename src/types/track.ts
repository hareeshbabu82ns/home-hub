import type {
  TrackItem,
  TrackAttributes,
  TrackAttributeValueType,
} from "@/app/generated/prisma";

export interface TrackItemWithAttributes extends TrackItem {
  TrackAttributes: TrackAttributes[];
}

export interface TrackAttributeFormData {
  id?: string;
  trackId: string;
  title: string;
  value?: string;
  valueInt?: number;
  valueFloat?: number;
  valueDate?: Date;
  valueType: TrackAttributeValueType;
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
