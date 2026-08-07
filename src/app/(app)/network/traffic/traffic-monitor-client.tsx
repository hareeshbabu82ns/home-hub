"use client";

import { Activity, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { NetworkTrafficRecord } from "@/types/network";

const WINDOW_OPTIONS = [10, 30, 60, 300] as const;
const MAX_HISTORY_POINTS = 3600;
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

type HistoryPoint = {
  timestamp: number;
  values: Record<string, number>;
};

function formatRateBits(bits: number): string {
  if (bits >= 1_000_000_000) {
    return `${(bits / 1_000_000_000).toFixed(2)} Gbps`;
  }

  if (bits >= 1_000_000) {
    return `${(bits / 1_000_000).toFixed(2)} Mbps`;
  }

  if (bits >= 1_000) {
    return `${(bits / 1_000).toFixed(2)} Kbps`;
  }

  return `${bits.toFixed(0)} bps`;
}

function formatTimeLabel(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TrafficMonitorClient() {
  const [windowSeconds, setWindowSeconds] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<NetworkTrafficRecord[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [addressNameMap, setAddressNameMap] = useState<Record<string, string>>(
    {},
  );

  const fetchTraffic = useCallback(async () => {
    setPolling(true);

    const result = await getNetworkTrafficTopLan();
    const now = Date.now();
    const snapshot = result.data;

    if (!result.success || !snapshot) {
      setError(result.error || "Failed to load traffic data");
      setPolling(false);
      setLoading(false);
      return;
    }

    setError(null);
    setRecords(snapshot.records);
    setAddressNameMap((previous) => {
      const next = { ...previous };
      for (const record of snapshot.records) {
        next[record.address] =
          record.displayName || record.rname || record.address;
      }
      return next;
    });

    const point: HistoryPoint = {
      timestamp: now,
      values: snapshot.records.reduce<Record<string, number>>((acc, record) => {
        acc[record.address] = record.rateBits;
        return acc;
      }, {}),
    };

    setHistory((previous) => {
      const next = [...previous, point];
      if (next.length <= MAX_HISTORY_POINTS) {
        return next;
      }

      return next.slice(next.length - MAX_HISTORY_POINTS);
    });

    setPolling(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchTraffic();

    const interval = setInterval(() => {
      void fetchTraffic();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTraffic]);

  const visibleHistory = useMemo(() => {
    const minTimestamp = Date.now() - windowSeconds * 1000;
    return history.filter((row) => row.timestamp >= minTimestamp);
  }, [history, windowSeconds]);

  const trackedAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const point of visibleHistory) {
      for (const address of Object.keys(point.values)) {
        set.add(address);
      }
    }

    return Array.from(set).slice(0, 8);
  }, [visibleHistory]);

  const chartData = useMemo(() => {
    return visibleHistory.map((point) => {
      const row: Record<string, string | number> = {
        timestamp: point.timestamp,
        label: formatTimeLabel(point.timestamp),
      };

      for (const address of trackedAddresses) {
        row[address] = point.values[address] ?? 0;
      }

      return row;
    });
  }, [visibleHistory, trackedAddresses]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            LAN Traffic (Live)
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select
              value={String(windowSeconds)}
              onValueChange={(value) => setWindowSeconds(Number(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}s window
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-2">
              {polling ? <Loader2 className="size-3 animate-spin" /> : null}
              1s refresh
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-destructive rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/40 dark:bg-red-950/20">
              {error}
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-muted-foreground h-80 text-center text-sm">
              No data points yet.
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => formatRateBits(Number(value))}
                  />
                  <Tooltip
                    formatter={(value: number, address: string) => [
                      formatRateBits(value),
                      addressNameMap[address] || address,
                    ]}
                    labelFormatter={(_label, payload) => {
                      const ts = payload?.[0]?.payload?.timestamp;
                      if (typeof ts === "number") {
                        return new Date(ts).toLocaleTimeString();
                      }
                      return "";
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      addressNameMap[String(value)] || String(value)
                    }
                  />
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

      <Card>
        <CardHeader>
          <CardTitle>Current Top Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active LAN traffic.
            </p>
          ) : (
            <div className="space-y-2">
              {records.map((row) => (
                <div
                  key={row.address}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {row.displayName || row.rname || row.address}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {row.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">In</p>
                      <p className="font-medium">
                        {formatRateBits(row.rateBitsIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Out</p>
                      <p className="font-medium">
                        {formatRateBits(row.rateBitsOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total</p>
                      <p className="font-medium">
                        {formatRateBits(row.rateBits)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
