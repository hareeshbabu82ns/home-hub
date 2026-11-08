"use client";

import { Activity, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNetworkTrafficTopLan } from "@/lib/actions/network";
import { getTrafficOverview } from "@/lib/actions/network-insights";
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

function formatTimeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
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

  const chartData = useMemo(
    () =>
      visibleHistory.map((point) => {
        const row: Record<string, string | number> = {
          timestamp: point.timestamp,
          label: formatTimeLabel(point.timestamp),
        };
        for (const address of trackedAddresses) {
          row[address] = point.values[address] ?? 0;
        }
        return row;
      }),
    [visibleHistory, trackedAddresses],
  );

  const sortedLive = useMemo(
    () => [...liveRows].sort((a, b) => b.rateBits - a.rateBits),
    [liveRows],
  );

  return (
    <div className="space-y-6">
      {mode === "direct" && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            The background collector isn&apos;t running, so this page polls the
            router directly and keeps no history. Start it with{" "}
            <code className="font-mono">pnpm collector</code> or set{" "}
            <code className="font-mono">NETWORK_COLLECTOR=embedded</code>.
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            LAN Traffic
          </CardTitle>
          <div className="flex items-center gap-3">
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
                  className={`size-2 rounded-full ${status?.running ? "bg-emerald-500" : "bg-amber-500"}`}
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
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} />
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
                    labelFormatter={(_label, payload) => {
                      const ts = payload?.[0]?.payload?.timestamp;
                      return typeof ts === "number" ? new Date(ts).toLocaleTimeString() : "";
                    }}
                  />
                  <Legend formatter={(value) => nameMap[String(value)] || String(value)} />
                  {trackedAddresses.map((address, index) => (
                    <Line
                      key={address}
                      type="monotone"
                      dataKey={address}
                      stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
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
            {sortedLive.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active LAN traffic.</p>
            ) : (
              <div className="space-y-2">
                {sortedLive.map((row) => (
                  <div
                    key={row.address}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      {row.deviceId ? (
                        <Link
                          href={`/network/devices/${row.deviceId}`}
                          className="font-medium hover:underline"
                        >
                          {row.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{row.name}</p>
                      )}
                      <p className="text-muted-foreground font-mono text-xs">{row.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Down</p>
                        <p className="font-medium">{formatRateBits(row.rateBitsIn)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Up</p>
                        <p className="font-medium">{formatRateBits(row.rateBitsOut)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top consumers today</CardTitle>
            <p className="text-muted-foreground text-xs">
              Estimated from sampled traffic since midnight UTC.
            </p>
          </CardHeader>
          <CardContent>
            {topToday.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {mode === "direct"
                  ? "Usage history needs the background collector."
                  : "No usage recorded yet today."}
              </p>
            ) : (
              <div className="space-y-2">
                {topToday.map((row) => (
                  <div
                    key={row.deviceId}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/network/devices/${row.deviceId}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.ipAddress && (
                        <p className="text-muted-foreground font-mono text-xs">{row.ipAddress}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">↓ {formatBytes(row.bytesIn)}</p>
                      <p className="text-muted-foreground text-xs">↑ {formatBytes(row.bytesOut)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
