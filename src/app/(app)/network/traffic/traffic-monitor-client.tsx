"use client";

import { CollectorBanner } from "@/components/network/collector-banner";
import { Activity, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnimatedLeaderboard } from "@/components/network/animated-leaderboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getNetworkTrafficTopLan } from "@/lib/actions/network";
import { getTrafficOverview } from "@/lib/actions/network-insights";
import { breakGaps } from "@/lib/network/chart-gaps";
import { formatBytes, formatRateBits } from "@/lib/network/format";
import type {
  CollectorStatus,
  LiveTrafficRow,
  TopConsumer,
  TrafficHistoryPoint,
} from "@/types/network-insights";

const WINDOW_OPTIONS = [
  { minutes: 1, label: "1 minute" },
  { minutes: 5, label: "5 minutes" },
  { minutes: 15, label: "15 minutes" },
  { minutes: 60, label: "1 hour" },
] as const;
const MAX_SERIES = 8;
const POLL_GAP_MS = 1000;
// While polling directly, check whether the collector came back.
const COLLECTOR_RECHECK_MS = 30_000;
// Moving-average width when smoothing is on.
const SMOOTH_SAMPLES = 3;
const SERIES_COLORS = [
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
] as const;

type Mode = "loading" | "collector" | "direct";
/** One chart point: time plus bits/s per address. */
type ChartRow = { timestamp: number } & Record<string, number>;

function formatClock(timestamp: number, withSeconds: boolean): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
  });
}

function toPoint(timestamp: number, rows: LiveTrafficRow[]): TrafficHistoryPoint {
  return {
    timestamp,
    values: Object.fromEntries(rows.map((row) => [row.address, row.rateBits])),
  };
}

export function TrafficMonitorClient() {
  const [windowMinutes, setWindowMinutes] = useState(5);
  const [smooth, setSmooth] = useState(true);
  const [mode, setMode] = useState<Mode>("loading");
  const [status, setStatus] = useState<CollectorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TrafficHistoryPoint[]>([]);
  const [liveRows, setLiveRows] = useState<LiveTrafficRow[]>([]);
  const [topToday, setTopToday] = useState<TopConsumer[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const inFlightRef = useRef(false);

  const applyRows = useCallback((timestamp: number, rows: LiveTrafficRow[]) => {
    setLiveRows(rows);
    setNameMap((previous) => {
      const next = { ...previous };
      for (const row of rows) next[row.address] = row.name;
      return next;
    });
    setHistory((previous) => {
      if (previous.at(-1)?.timestamp === timestamp) return previous;
      const next = [...previous, toPoint(timestamp, rows)];
      // Keep at most an hour of points.
      const cutoff = timestamp - 60 * 60 * 1000;
      return next[0]!.timestamp < cutoff ? next.filter((p) => p.timestamp >= cutoff) : next;
    });
  }, []);

  // Initial load (and on window change): history + whether the collector runs.
  useEffect(() => {
    let cancelled = false;
    void getTrafficOverview(windowMinutes).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        setMode("direct");
        return;
      }
      setError(null);
      setStatus(result.data.status);
      setTopToday(result.data.topToday);
      setHistory(result.data.history);
      setMode(result.data.status.running ? "collector" : "direct");
    });
    return () => {
      cancelled = true;
    };
  }, [windowMinutes]);

  // Collector mode: live updates over server-sent events.
  useEffect(() => {
    if (mode !== "collector") return;
    const source = new EventSource("/api/network/live");
    let staleTicks = 0;

    source.addEventListener("traffic", (event) => {
      const live = JSON.parse((event as MessageEvent).data) as {
        at: string;
        rows: LiveTrafficRow[];
      };
      applyRows(Date.parse(live.at), live.rows);
    });
    source.addEventListener("status", (event) => {
      const next = JSON.parse((event as MessageEvent).data) as CollectorStatus;
      setStatus(next);
      staleTicks = next.running ? 0 : staleTicks + 1;
      // ~10s without collector output: poll the router directly instead.
      if (staleTicks >= 5) setMode("direct");
    });
    return () => source.close();
  }, [mode, applyRows]);

  // Re-rank "Top consumers today" while live (usage accrues every few seconds).
  useEffect(() => {
    if (mode !== "collector") return;
    let cancelled = false;
    const timer = setInterval(() => {
      void getTrafficOverview(1).then((result) => {
        if (!cancelled && result.success) setTopToday(result.data.topToday);
      });
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [mode]);

  // Direct mode: poll the router from this page (collector not running).
  const fetchDirect = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const startedAt = Date.now();
    const result = await getNetworkTrafficTopLan().finally(() => {
      inFlightRef.current = false;
    });
    const now = Date.now();
    setLastLatencyMs(now - startedAt);
    if (!result.success || !result.data) {
      setError(result.error || "Failed to load traffic data");
      return;
    }
    setError(null);
    applyRows(
      now,
      result.data.records.map((record) => ({
        address: record.address,
        deviceId: null,
        name: record.displayName,
        rateBitsIn: record.rateBitsIn,
        rateBitsOut: record.rateBitsOut,
        rateBits: record.rateBits,
      })),
    );
  }, [applyRows]);

  useEffect(() => {
    if (mode !== "direct") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loop = async () => {
      if (document.visibilityState === "visible") await fetchDirect();
      if (!cancelled) timer = setTimeout(loop, POLL_GAP_MS);
    };
    void loop();
    // Switch back to the live feed once the collector is running again.
    const recheck = setInterval(() => {
      void getTrafficOverview(1).then((result) => {
        if (cancelled || !result.success) return;
        // Keeps the banner's error current while waiting.
        setStatus(result.data.status);
        if (result.data.status.running) {
          setTopToday(result.data.topToday);
          setMode("collector");
        }
      });
    }, COLLECTOR_RECHECK_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      clearInterval(recheck);
    };
  }, [mode, fetchDirect]);

  const visibleHistory = useMemo(() => {
    // Anchor the window to the newest sample (keeps render pure).
    const latest = history.at(-1)?.timestamp ?? 0;
    const minTimestamp = latest - windowMinutes * 60 * 1000;
    return history.filter((row) => row.timestamp >= minTimestamp);
  }, [history, windowMinutes]);

  // Chart the busiest hosts in the window (by peak rate).
  const trackedAddresses = useMemo(() => {
    const peak = new Map<string, number>();
    for (const point of visibleHistory) {
      for (const [address, rate] of Object.entries(point.values)) {
        peak.set(address, Math.max(peak.get(address) ?? 0, rate));
      }
    }
    return Array.from(peak.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SERIES)
      .map(([address]) => address);
  }, [visibleHistory]);

  const chartData = useMemo(() => {
    const raw = visibleHistory.map((point) => {
      const row: ChartRow = { timestamp: point.timestamp };
      for (const address of trackedAddresses) row[address] = point.values[address] ?? 0;
      return row;
    });
    // Samples come every ~4s (longer windows: 10–30s buckets); a minute
    // without any means nothing was recorded, so break the line there.
    const withGaps = (rows: ChartRow[]) =>
      breakGaps(rows, 60_000, (timestamp): ChartRow => ({ timestamp }));
    if (!smooth) return withGaps(raw);
    // Trailing moving average: top-talker samples are spiky (~2s windows).
    return withGaps(
      raw.map((row, index) => {
        const window = raw.slice(Math.max(0, index - SMOOTH_SAMPLES + 1), index + 1);
        const averaged: ChartRow = { timestamp: row.timestamp };
        for (const address of trackedAddresses) {
          averaged[address] = window.reduce((sum, r) => sum + (r[address] ?? 0), 0) / window.length;
        }
        return averaged;
      }),
    );
  }, [visibleHistory, trackedAddresses, smooth]);

  const liveItems = useMemo(
    () =>
      liveRows.map((row) => ({
        id: row.address,
        label: row.name,
        href: row.deviceId ? `/network/devices/${row.deviceId}` : undefined,
        sublabel: row.address,
        value: row.rateBits,
        split: [row.rateBitsIn, row.rateBitsOut] as [number, number],
      })),
    [liveRows],
  );

  const topItems = useMemo(
    () =>
      topToday.map((row) => ({
        id: row.deviceId,
        label: row.name,
        href: `/network/devices/${row.deviceId}`,
        sublabel: row.ipAddress ?? undefined,
        value: row.bytesIn + row.bytesOut,
        split: [row.bytesIn, row.bytesOut] as [number, number],
      })),
    [topToday],
  );

  const longWindow = windowMinutes > 5;

  return (
    <div className="space-y-6">
      {mode === "direct" && (
        <CollectorBanner
          status={status ?? { running: false, alive: false, heartbeatAt: null, lastDiscoveryAt: null, lastError: null }}
          fallback="Meanwhile this page polls the router directly and keeps no history. It switches back to the live feed automatically."
        />
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            LAN Traffic
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="smooth-chart" checked={smooth} onCheckedChange={setSmooth} />
              <Label htmlFor="smooth-chart" className="text-sm">
                Smooth
              </Label>
            </div>
            <Select
              value={String(windowMinutes)}
              onValueChange={(value) => setWindowMinutes(Number(value))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Window" />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((option) => (
                  <SelectItem key={option.minutes} value={String(option.minutes)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-2">
              {mode === "loading" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : mode === "collector" ? (
                <span
                  className={`size-2 rounded-full ${status?.running ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`}
                />
              ) : null}
              {mode === "collector"
                ? "Live (collector)"
                : mode === "direct"
                  ? lastLatencyMs === null
                    ? "Polling router"
                    : `Polling ~${((lastLatencyMs + POLL_GAP_MS) / 1000).toFixed(1)}s`
                  : "Loading"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="text-destructive mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/40 dark:bg-red-950/20">
              {error}
            </div>
          )}
          {mode === "loading" ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-muted-foreground flex h-80 items-center justify-center text-sm">
              No traffic samples yet.
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    {trackedAddresses.map((address, index) => {
                      const color = SERIES_COLORS[index % SERIES_COLORS.length];
                      return (
                        <linearGradient
                          key={address}
                          id={`traffic-fill-${index}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {/* A real time axis: samples arrive ~4s apart, not evenly. */}
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                    tickFormatter={(value) => formatClock(Number(value), !longWindow)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => formatRateBits(Number(value))}
                  />
                  <Tooltip
                    formatter={(value, address) => [
                      formatRateBits(Number(value)),
                      nameMap[String(address)] || address,
                    ]}
                    labelFormatter={(label) => new Date(Number(label)).toLocaleTimeString()}
                  />
                  <Legend formatter={(value) => nameMap[String(value)] || String(value)} />
                  {trackedAddresses.map((address, index) => (
                    <Area
                      key={address}
                      type="monotone"
                      dataKey={address}
                      stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                      fill={`url(#traffic-fill-${index})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-in-out"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active right now</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedLeaderboard
              items={liveItems}
              format={formatRateBits}
              splitLabels={["↓", "↑"]}
              emptyText="No active LAN traffic."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top consumers today</CardTitle>
            <p className="text-muted-foreground text-xs">
              Estimated from sampled traffic since local midnight.
            </p>
          </CardHeader>
          <CardContent>
            <AnimatedLeaderboard
              items={topItems}
              format={formatBytes}
              splitLabels={["↓", "↑"]}
              emptyText={
                mode === "direct"
                  ? "Usage history needs the background collector."
                  : "No usage recorded yet today."
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
