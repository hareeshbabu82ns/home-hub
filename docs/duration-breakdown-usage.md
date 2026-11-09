# Duration Breakdown Structure - Usage Guide

## Overview

The time tracking system now stores duration data in a hierarchical structure that makes it easy to create charts, statistics, and analyze time usage patterns.

## Data Structure

```typescript
interface DurationBreakdown {
  totalDurationMs: number;
  durations: YearDuration[];
}

interface YearDuration {
  year: number;
  durationMs: number;
  durations: MonthDuration[];
}

interface MonthDuration {
  month: number; // 1-12
  durationMs: number;
  durations: DayDuration[];
}

interface DayDuration {
  day: number; // 1-31
  durationMs: number;
}
```

## Example Data

```json
{
  "totalDurationMs": 3600000,
  "durations": [
    {
      "year": 2025,
      "durationMs": 3600000,
      "durations": [
        {
          "month": 12,
          "durationMs": 3600000,
          "durations": [
            { "day": 1, "durationMs": 1800000 },
            { "day": 2, "durationMs": 1800000 }
          ]
        }
      ]
    }
  ]
}
```

## Storage

The `durationBreakdown` is automatically calculated and stored in the `TimeTopic` model as a JSON field:

```prisma
model TimeTopic {
  // ... other fields
  durationBreakdown Json? // Hierarchical breakdown by year/month/day
  // ... other fields
}
```

## Accessing the Data

### From Database

```typescript
const topic = await db.timeTopic.findUnique({
  where: { id: topicId },
});

const breakdown = topic.durationBreakdown as DurationBreakdown;
```

### Using Utility Functions

The system provides utility functions to easily extract data:

#### 1. Get Day Duration

```typescript
import { getDayDuration } from "@/lib/time-tracking-utils";

// Get duration for December 13, 2025
const duration = getDayDuration(topic.durationBreakdown, 2025, 12, 13);
console.log(`Duration: ${duration}ms`);
```

#### 2. Get Month Duration

```typescript
import { getMonthDuration } from "@/lib/time-tracking-utils";

// Get total duration for December 2025
const duration = getMonthDuration(topic.durationBreakdown, 2025, 12);
console.log(`Month total: ${duration}ms`);
```

#### 3. Get Year Duration

```typescript
import { getYearDuration } from "@/lib/time-tracking-utils";

// Get total duration for 2025
const duration = getYearDuration(topic.durationBreakdown, 2025);
console.log(`Year total: ${duration}ms`);
```

#### 4. Get All Days in Month (for charts)

```typescript
import { getMonthDays } from "@/lib/time-tracking-utils";

// Get all days with durations for December 2025
const days = getMonthDays(topic.durationBreakdown, 2025, 12);
// Returns: [{ day: 1, durationMs: 1800000 }, { day: 2, durationMs: 1800000 }]

// Use for daily chart
days.forEach(({ day, durationMs }) => {
  console.log(`Day ${day}: ${durationMs / 1000 / 60} minutes`);
});
```

#### 5. Get All Months in Year (for charts)

```typescript
import { getYearMonths } from "@/lib/time-tracking-utils";

// Get all months with durations for 2025
const months = getYearMonths(topic.durationBreakdown, 2025);
// Returns: [{ month: 12, durationMs: 3600000, durations: [...] }]

// Use for monthly chart
months.forEach(({ month, durationMs }) => {
  console.log(`Month ${month}: ${durationMs / 1000 / 60 / 60} hours`);
});
```

## Use Cases

### 1. Daily Activity Chart

```typescript
// Get all days for the current month
const now = new Date();
const days = getMonthDays(
  topic.durationBreakdown,
  now.getFullYear(),
  now.getMonth() + 1,
);

// Create chart data
const chartData = days.map(({ day, durationMs }) => ({
  day: `Dec ${day}`,
  hours: durationMs / 1000 / 60 / 60,
}));
```

### 2. Monthly Overview Chart

```typescript
// Get all months for the current year
const year = new Date().getFullYear();
const months = getYearMonths(topic.durationBreakdown, year);

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const chartData = months.map(({ month, durationMs }) => ({
  month: monthNames[month - 1],
  hours: durationMs / 1000 / 60 / 60,
}));
```

### 3. Year Comparison

```typescript
const breakdown = topic.durationBreakdown;
const years = breakdown?.durations || [];

years.forEach(({ year, durationMs }) => {
  console.log(`${year}: ${durationMs / 1000 / 60 / 60} hours`);
});
```

### 4. Heatmap Calendar View

```typescript
// Get all days for a month to show in calendar heatmap
const days = getMonthDays(topic.durationBreakdown, 2025, 12);

// Create a map for easy lookup
const durationMap = new Map(
  days.map(({ day, durationMs }) => [day, durationMs]),
);

// Render calendar (31 days max)
for (let day = 1; day <= 31; day++) {
  const duration = durationMap.get(day) || 0;
  const intensity = duration > 0 ? Math.min(duration / (60 * 60 * 1000), 5) : 0;
  // Use intensity for color coding: 0 = no activity, 5+ = max activity
}
```

## Updating Data

The duration breakdown is automatically recalculated whenever:

1. A timer is stopped
2. A session is deleted
3. A session is updated
4. Manual refresh is triggered

### Manual Refresh

To manually recalculate all topics for a user:

```typescript
import { refreshAllTopicStats } from "@/app/(app)/time-tracking/actions";

// Recalculates breakdown for all user's topics
await refreshAllTopicStats();
```

## Performance Benefits

### Before (Calculating on-the-fly)

- Every chart/stat request required aggregating all sessions
- Database queries were expensive for large datasets
- Difficult to create complex time-range queries

### After (Pre-computed structure)

- Instant access to any time range (day/month/year)
- No database queries needed for charts
- Easy to create complex visualizations
- Structure is indexed and optimized for JSON queries

## Migration

Existing topics will automatically get the `durationBreakdown` field populated:

- When a timer is stopped
- When `refreshAllTopicStats()` is called
- When any session is modified

To immediately update all topics:

```typescript
// Run this once after deployment
await refreshAllTopicStats();
```

## TypeScript Types

All types are exported from `@/types/time-tracking`:

```typescript
import type {
  DurationBreakdown,
  YearDuration,
  MonthDuration,
  DayDuration,
} from "@/types/time-tracking";
```

## Notes

- All durations are in **milliseconds**
- Month values are **1-12** (not 0-11)
- Day values are **1-31**
- Years are **4-digit** (e.g., 2025)
- Data is sorted: years ascending, months ascending, days ascending
- Null/undefined breakdown means no completed sessions yet
