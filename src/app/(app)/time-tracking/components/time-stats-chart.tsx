"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import {
  getTimeTrackingStats,
  getTimeTopicsForStats,
  type TimeTrackingStats,
  type TimeStatsPeriod,
} from "../actions";

interface TimeStatsChartProps {
  initialTopicId?: string;
  className?: string;
}

export function TimeStatsChart({
  initialTopicId,
  className,
}: TimeStatsChartProps) {
  const [topics, setTopics] = useState<
    Array<{ id: string; name: string; color: string; sessionCount: number }>
  >([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || "",
  );
  const [period, setPeriod] = useState<TimeStatsPeriod>("weekly");
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<TimeTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Load topics for dropdown
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const items = await getTimeTopicsForStats();
        setTopics(items);

        // Auto-select first item with data if none selected
        if (!selectedTopicId && items.length > 0) {
          const firstWithData = items.find((item) => item.sessionCount > 0);
          if (firstWithData) {
            setSelectedTopicId(firstWithData.id);
          } else {
            setSelectedTopicId(items[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading topics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [selectedTopicId]);

  // Load stats when selection changes
  const loadStats = useCallback(async () => {
    if (!selectedTopicId) {
      setStats(null);
      return;
    }

    try {
      setChartLoading(true);
      const data = await getTimeTrackingStats(selectedTopicId, period, offset);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats(null);
    } finally {
      setChartLoading(false);
    }
  }, [selectedTopicId, period, offset]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset offset when period or topic changes
  useEffect(() => {
    setOffset(0);
  }, [period, selectedTopicId]);

  const handlePrevious = () => {
    if (stats?.hasPrevious) {
      setOffset((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (stats?.hasNext) {
      setOffset((prev) => prev + 1);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    setOffset(0);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as TimeStatsPeriod);
    setOffset(0);
  };

  // Format duration from minutes to readable format
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}m`;
  };

  // Get chart color from topic or use default
  const chartColor = stats?.topicColor || "hsl(var(--chart-1))";

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex h-100 items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (topics.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex h-100 flex-col items-center justify-center gap-4">
          <Clock className="text-muted-foreground size-12" />
          <p className="text-muted-foreground">
            No topics found. Create a topic to see time stats.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasData = stats && stats.data.some((point) => point.value > 0);

  return (
    <Card className={className}>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Time Statistics
          </CardTitle>

          {/* Topic Selector */}
          <Select value={selectedTopicId} onValueChange={handleTopicChange}>
            <SelectTrigger className="w-full sm:w-50">
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    <span>{topic.name}</span>
                    {topic.sessionCount > 0 && (
                      <span className="text-muted-foreground text-xs">
                        ({topic.sessionCount})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period Tabs and Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Period Selection */}
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={!stats?.hasPrevious || chartLoading}
              aria-label="Previous period"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="min-w-45 text-center text-sm font-medium">
              {chartLoading ? (
                <Loader2 className="mx-auto size-4 animate-spin" />
              ) : (
                stats?.periodLabel || "Select a topic"
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={!stats?.hasNext || chartLoading}
              aria-label="Next period"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {chartLoading ? (
          <div className="flex h-75 items-center justify-center">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="flex h-75 flex-col items-center justify-center gap-2">
            <Clock className="text-muted-foreground size-12" />
            <p className="text-muted-foreground text-center">
              No time tracked for this period.
              <br />
              <span className="text-sm">
                Try selecting a different period or topic.
              </span>
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.data || []}>
              <defs>
                <linearGradient id="colorTimeValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground fill-current"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground fill-current"
                tickLine={false}
                axisLine={false}
                width={50}
                tickFormatter={(value) => formatDuration(value)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-popover text-popover-foreground rounded-lg border p-3 shadow-md">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-muted-foreground text-sm">
                          Duration:{" "}
                          <span className="text-foreground font-medium">
                            {formatDuration(data.value as number)}
                          </span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {(data.payload as { label: string }).label}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorTimeValue)"
                dot={{
                  r: 3,
                  fill: chartColor,
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 5,
                  fill: chartColor,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Summary Stats */}
        {hasData && stats && (
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="text-lg font-semibold">
                {formatDuration(
                  stats.data.reduce((sum, point) => sum + point.value, 0),
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Average</p>
              <p className="text-lg font-semibold">
                {formatDuration(
                  Math.round(
                    stats.data.reduce((sum, point) => sum + point.value, 0) /
                      (stats.data.filter((p) => p.value > 0).length || 1),
                  ),
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Peak</p>
              <p className="text-lg font-semibold">
                {formatDuration(
                  Math.max(...stats.data.map((point) => point.value)),
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
