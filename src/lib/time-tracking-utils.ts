/**
 * Time Tracking Utility Functions
 * Pure functions for working with duration breakdown data
 */

import type {
  DurationBreakdown,
  MonthDuration,
  DayDuration,
} from "@/types/time-tracking";

/**
 * Get duration for a specific day from breakdown
 * @param breakdown - DurationBreakdown object
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @param day - Day of month (1-31)
 * @returns Duration in milliseconds, or 0 if not found
 */
export function getDayDuration(
  breakdown: DurationBreakdown | null | undefined,
  year: number,
  month: number,
  day: number,
): number {
  if (!breakdown) return 0;

  const yearData = breakdown.durations.find((y) => y.year === year);
  if (!yearData) return 0;

  const monthData = yearData.durations.find((m) => m.month === month);
  if (!monthData) return 0;

  const dayData = monthData.durations.find((d) => d.day === day);
  return dayData?.durationMs || 0;
}

/**
 * Get duration for a specific month from breakdown
 * @param breakdown - DurationBreakdown object
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Duration in milliseconds, or 0 if not found
 */
export function getMonthDuration(
  breakdown: DurationBreakdown | null | undefined,
  year: number,
  month: number,
): number {
  if (!breakdown) return 0;

  const yearData = breakdown.durations.find((y) => y.year === year);
  if (!yearData) return 0;

  const monthData = yearData.durations.find((m) => m.month === month);
  return monthData?.durationMs || 0;
}

/**
 * Get duration for a specific year from breakdown
 * @param breakdown - DurationBreakdown object
 * @param year - Year (e.g., 2025)
 * @returns Duration in milliseconds, or 0 if not found
 */
export function getYearDuration(
  breakdown: DurationBreakdown | null | undefined,
  year: number,
): number {
  if (!breakdown) return 0;

  const yearData = breakdown.durations.find((y) => y.year === year);
  return yearData?.durationMs || 0;
}

/**
 * Get all days with durations for a specific month
 * Useful for creating calendar views or day-by-day charts
 * @param breakdown - DurationBreakdown object
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Array of { day, durationMs } or empty array
 */
export function getMonthDays(
  breakdown: DurationBreakdown | null | undefined,
  year: number,
  month: number,
): DayDuration[] {
  if (!breakdown) return [];

  const yearData = breakdown.durations.find((y) => y.year === year);
  if (!yearData) return [];

  const monthData = yearData.durations.find((m) => m.month === month);
  return monthData?.durations || [];
}

/**
 * Get all months with durations for a specific year
 * Useful for monthly charts
 * @param breakdown - DurationBreakdown object
 * @param year - Year (e.g., 2025)
 * @returns Array of { month, durationMs, durations } or empty array
 */
export function getYearMonths(
  breakdown: DurationBreakdown | null | undefined,
  year: number,
): MonthDuration[] {
  if (!breakdown) return [];

  const yearData = breakdown.durations.find((y) => y.year === year);
  return yearData?.durations || [];
}

/**
 * Get duration for today from breakdown
 * @param breakdown - DurationBreakdown object
 * @returns Duration in milliseconds for today
 */
export function getTodayDuration(
  breakdown: DurationBreakdown | null | undefined,
): number {
  const now = new Date();
  return getDayDuration(
    breakdown,
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
}

/**
 * Get duration for current week from breakdown
 * @param breakdown - DurationBreakdown object
 * @returns Duration in milliseconds for current week (Monday - today)
 */
export function getWeekDuration(
  breakdown: DurationBreakdown | null | undefined,
): number {
  if (!breakdown) return 0;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Days since Monday

  let total = 0;
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  // Sum up durations from Monday to today
  for (let i = 0; i <= daysFromMonday; i++) {
    const day = today - i;
    if (day > 0) {
      total += getDayDuration(breakdown, year, month, day);
    } else {
      // Handle case where week spans two months
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      total += getDayDuration(
        breakdown,
        prevYear,
        prevMonth,
        daysInPrevMonth + day,
      );
    }
  }

  return total;
}

/**
 * Get duration for current month from breakdown
 * @param breakdown - DurationBreakdown object
 * @returns Duration in milliseconds for current month
 */
export function getCurrentMonthDuration(
  breakdown: DurationBreakdown | null | undefined,
): number {
  const now = new Date();
  return getMonthDuration(breakdown, now.getFullYear(), now.getMonth() + 1);
}

/**
 * Get total duration from breakdown
 * @param breakdown - DurationBreakdown object
 * @returns Total duration in milliseconds
 */
export function getTotalDuration(
  breakdown: DurationBreakdown | null | undefined,
): number {
  return breakdown?.totalDurationMs || 0;
}
