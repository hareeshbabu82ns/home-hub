/**
 * Example: Using Duration Breakdown in a Chart Component
 *
 * This file demonstrates how to use the new hierarchical duration structure
 * to create charts and statistics for time tracking data.
 */

import type { DurationBreakdown } from "@/types/time-tracking";
import {
  getDayDuration,
  getMonthDuration,
  getYearDuration,
  getMonthDays,
} from "@/lib/time-tracking-utils";

// ============================================
// Example 1: Daily Activity Bar Chart
// ============================================

interface DailyChartProps {
  breakdown: DurationBreakdown | null;
  year: number;
  month: number;
}

export function DailyActivityChart({
  breakdown,
  year,
  month,
}: DailyChartProps) {
  const days = getMonthDays(breakdown, year, month);

  return (
    <div className="space-y-2">
      <h3>
        Daily Activity - {month}/{year}
      </h3>
      {days.map(({ day, durationMs }) => {
        const hours = (durationMs / 1000 / 60 / 60).toFixed(1);
        const widthPercent = Math.min(
          (durationMs / (8 * 60 * 60 * 1000)) * 100,
          100,
        );

        return (
          <div key={day} className="flex items-center gap-2">
            <span className="w-12 text-sm">Day {day}</span>
            <div className="flex-1 rounded bg-gray-200">
              <div
                className="h-6 rounded bg-indigo-500"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <span className="w-16 text-sm">{hours}h</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Example 2: Monthly Overview
// ============================================

interface MonthlyOverviewProps {
  breakdown: DurationBreakdown | null;
  year: number;
}

export function MonthlyOverview({ breakdown, year }: MonthlyOverviewProps) {
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

  return (
    <div className="grid grid-cols-3 gap-4">
      {monthNames.map((name, index) => {
        const monthNum = index + 1;
        const duration = getMonthDuration(breakdown, year, monthNum);
        const hours = (duration / 1000 / 60 / 60).toFixed(0);
        const hasData = duration > 0;

        return (
          <div
            key={name}
            className={`rounded-lg p-4 ${
              hasData ? "border-indigo-200 bg-indigo-50" : "bg-gray-50"
            } border`}
          >
            <div className="text-sm text-gray-600">{name}</div>
            <div className="text-2xl font-bold">
              {hasData ? `${hours}h` : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Example 3: Stats Summary Card
// ============================================

interface StatsSummaryProps {
  breakdown: DurationBreakdown | null;
}

export function StatsSummary({ breakdown }: StatsSummaryProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const todayMs = getDayDuration(breakdown, year, month, day);
  const monthMs = getMonthDuration(breakdown, year, month);
  const yearMs = getYearDuration(breakdown, year);
  const totalMs = breakdown?.totalDurationMs || 0;

  const formatHours = (ms: number) => (ms / 1000 / 60 / 60).toFixed(1);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm text-gray-600">Today</div>
        <div className="text-2xl font-bold">{formatHours(todayMs)}h</div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm text-gray-600">This Month</div>
        <div className="text-2xl font-bold">{formatHours(monthMs)}h</div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm text-gray-600">This Year</div>
        <div className="text-2xl font-bold">{formatHours(yearMs)}h</div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm text-gray-600">All Time</div>
        <div className="text-2xl font-bold">{formatHours(totalMs)}h</div>
      </div>
    </div>
  );
}

// ============================================
// Example 4: Calendar Heatmap
// ============================================

interface CalendarHeatmapProps {
  breakdown: DurationBreakdown | null;
  year: number;
  month: number;
}

export function CalendarHeatmap({
  breakdown,
  year,
  month,
}: CalendarHeatmapProps) {
  const days = getMonthDays(breakdown, year, month);
  const durationMap = new Map(
    days.map(({ day, durationMs }) => [day, durationMs]),
  );

  // Get first day of month to calculate offset
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // Calculate intensity (0-5 scale based on hours)
  const getIntensity = (durationMs: number) => {
    if (durationMs === 0) return 0;
    const hours = durationMs / 1000 / 60 / 60;
    if (hours < 1) return 1;
    if (hours < 2) return 2;
    if (hours < 4) return 3;
    if (hours < 6) return 4;
    return 5;
  };

  const intensityColors = [
    "bg-gray-100", // 0: no data
    "bg-indigo-100", // 1: < 1h
    "bg-indigo-200", // 2: 1-2h
    "bg-indigo-400", // 3: 2-4h
    "bg-indigo-600", // 4: 4-6h
    "bg-indigo-800", // 5: 6+ h
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs text-gray-600">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const duration = durationMap.get(day) || 0;
          const intensity = getIntensity(duration);
          const hours = (duration / 1000 / 60 / 60).toFixed(1);

          return (
            <div
              key={day}
              className={`aspect-square rounded ${intensityColors[intensity]} flex cursor-pointer items-center justify-center text-sm hover:ring-2 hover:ring-indigo-500`}
              title={`${day}: ${hours}h`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="text-gray-600">Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={`h-4 w-4 rounded ${color}`} />
        ))}
        <span className="text-gray-600">More</span>
      </div>
    </div>
  );
}

// ============================================
// Example 5: Year Comparison
// ============================================

interface YearComparisonProps {
  breakdown: DurationBreakdown | null;
}

export function YearComparison({ breakdown }: YearComparisonProps) {
  const years = breakdown?.durations || [];

  return (
    <div className="space-y-2">
      <h3>Year-over-Year Comparison</h3>
      {years.map(({ year, durationMs }) => {
        const hours = (durationMs / 1000 / 60 / 60).toFixed(0);
        const maxHours =
          Math.max(...years.map((y) => y.durationMs)) / 1000 / 60 / 60;
        const widthPercent = (durationMs / 1000 / 60 / 60 / maxHours) * 100;

        return (
          <div key={year} className="flex items-center gap-4">
            <span className="w-16 text-sm font-medium">{year}</span>
            <div className="flex-1 rounded bg-gray-200">
              <div
                className="flex h-8 items-center rounded bg-indigo-500 px-2 text-sm text-white"
                style={{ width: `${widthPercent}%` }}
              >
                {hours}h
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Example 6: Using in Server Component
// ============================================

/**
 * Server Component Example
 * Shows how to fetch and use the breakdown data
 */
import { db } from "@/lib/db";
import { getUserAuth } from "@/lib/auth/utils";

export async function TimeStatsPage() {
  const { session } = await getUserAuth();
  if (!session) return null;

  const topics = await db.timeTopic.findMany({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-8">
      {topics.map((topic) => {
        const breakdown =
          topic.durationBreakdown as unknown as DurationBreakdown;
        const now = new Date();

        return (
          <div key={topic.id} className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">{topic.name}</h2>

            <StatsSummary breakdown={breakdown} />

            <div className="mt-6">
              <CalendarHeatmap
                breakdown={breakdown}
                year={now.getFullYear()}
                month={now.getMonth() + 1}
              />
            </div>

            <div className="mt-6">
              <MonthlyOverview breakdown={breakdown} year={now.getFullYear()} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
