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
import { ChevronLeft, ChevronRight, BarChart3, Loader2 } from "lucide-react";
import {
  getTrackItemStats,
  getTrackItemsForStats,
  type TrackItemStats,
  type StatsPeriod,
} from "../actions";

interface TrackStatsChartProps {
  initialTrackItemId?: string;
  className?: string;
}

export function TrackStatsChart({
  initialTrackItemId,
  className,
}: TrackStatsChartProps) {
  const [trackItems, setTrackItems] = useState<
    Array<{ id: string; title: string; attributeCount: number }>
  >([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    initialTrackItemId || "",
  );
  const [period, setPeriod] = useState<StatsPeriod>("weekly");
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<TrackItemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Load track items for dropdown
  useEffect(() => {
    const loadTrackItems = async () => {
      try {
        const items = await getTrackItemsForStats();
        setTrackItems(items);

        // Auto-select first item with data if none selected
        if (!selectedTrackId && items.length > 0) {
          const firstWithData = items.find((item) => item.attributeCount > 0);
          if (firstWithData) {
            setSelectedTrackId(firstWithData.id);
          } else {
            setSelectedTrackId(items[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading track items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrackItems();
  }, [selectedTrackId]);

  // Load stats when selection changes
  const loadStats = useCallback(async () => {
    if (!selectedTrackId) {
      setStats(null);
      return;
    }

    try {
      setChartLoading(true);
      const data = await getTrackItemStats(selectedTrackId, period, offset);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats(null);
    } finally {
      setChartLoading(false);
    }
  }, [selectedTrackId, period, offset]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset offset when period or track changes
  useEffect(() => {
    setOffset(0);
  }, [period, selectedTrackId]);

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

  const handleTrackChange = (trackId: string) => {
    setSelectedTrackId(trackId);
    setOffset(0);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as StatsPeriod);
    setOffset(0);
  };

  // Format tooltip value based on the data
  const formatTooltipValue = (value: number) => {
    if (period === "daily") {
      // For daily view, show hours and minutes for duration
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex h-100 items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (trackItems.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex h-100 flex-col items-center justify-center gap-4">
          <BarChart3 className="text-muted-foreground size-12" />
          <p className="text-muted-foreground">
            No track items found. Create a track item to see stats.
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
            <BarChart3 className="size-5" />
            Track Statistics
          </CardTitle>

          {/* Track Item Selector */}
          <Select value={selectedTrackId} onValueChange={handleTrackChange}>
            <SelectTrigger className="w-full sm:w-50">
              <SelectValue placeholder="Select track item" />
            </SelectTrigger>
            <SelectContent>
              {trackItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <span>{item.title}</span>
                    {item.attributeCount > 0 && (
                      <span className="text-muted-foreground text-xs">
                        ({item.attributeCount})
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
                stats?.periodLabel || "Select a track"
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
            <BarChart3 className="text-muted-foreground size-12" />
            <p className="text-muted-foreground text-center">
              No data for this period.
              <br />
              <span className="text-sm">
                Try selecting a different period or track item.
              </span>
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.data || []}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0}
                  />
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
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-popover text-popover-foreground rounded-lg border p-3 shadow-md">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-muted-foreground text-sm">
                          Value:{" "}
                          <span className="text-foreground font-medium">
                            {formatTooltipValue(data.value as number)}
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
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#colorValue)"
                dot={{
                  r: 3,
                  fill: "hsl(var(--chart-1))",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 5,
                  fill: "hsl(var(--chart-1))",
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
                {formatTooltipValue(
                  stats.data.reduce((sum, point) => sum + point.value, 0),
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Average</p>
              <p className="text-lg font-semibold">
                {formatTooltipValue(
                  Math.round(
                    stats.data.reduce((sum, point) => sum + point.value, 0) /
                      stats.data.filter((p) => p.value > 0).length || 0,
                  ),
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Peak</p>
              <p className="text-lg font-semibold">
                {formatTooltipValue(
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
