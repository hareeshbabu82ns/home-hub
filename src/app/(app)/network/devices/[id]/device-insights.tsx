"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatedLeaderboard } from "@/components/network/animated-leaderboard";
import { getDeviceInsights } from "@/lib/actions/network-insights";
import { shiftDateString } from "@/lib/network/access-policy";
import { formatBytes } from "@/lib/network/format";
import type { DeviceHistory } from "@/types/network-insights";

/** A calendar date (YYYY-MM-DD) as a local Date, for labels only. */
function asDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/**
 * Usage, DNS and presence history recorded by the background collector, one
 * day at a time; the date controls and the 30-day chart go back in history.
 */
export function DeviceInsights({ deviceId }: { deviceId: string }) {
  // undefined = today (the server knows the network's local date).
  const [date, setDate] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<DeviceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDeviceInsights(deviceId, date).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.success) {
        setHistory(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId, date]);

  const select = (next: string | undefined) => {
    if (next === date) return;
    setLoading(true);
    setDate(next);
  };

  const hourlyChart = useMemo(
    () =>
      (history?.day.hourly ?? []).map((row) => ({
        label: row.label,
        download: row.bytesIn,
        upload: row.bytesOut,
      })),
    [history],
  );
  const dailyChart = useMemo(
    () =>
      (history?.daily ?? []).map((row) => ({
        date: row.date,
        label: format(asDate(row.date), "MMM d"),
        bytes: row.bytesIn + row.bytesOut,
      })),
    [history],
  );

  if (error && !history) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (!history) {
    return <p className="text-muted-foreground text-sm">Loading usage history…</p>;
  }

  const { day, daily, today } = history;
  const isToday = day.date === today;
  const dayLabel = isToday ? "Today" : format(asDate(day.date), "EEE, MMM d, yyyy");
  const dayBytes = day.totals.bytesIn + day.totals.bytesOut;
  const periodBytes = daily.reduce((sum, row) => sum + row.bytesIn + row.bytesOut, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Usage &amp; Activity
              {loading && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {dayLabel} · days in {history.timeZone}. Pick a date or a bar below to go back.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="Previous day"
              onClick={() => select(shiftDateString(day.date, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="date"
              className="w-40"
              aria-label="Day to show"
              max={today}
              value={day.date}
              onChange={(event) => event.target.value && select(event.target.value >= today ? undefined : event.target.value)}
            />
            <Button
              size="icon"
              variant="outline"
              aria-label="Next day"
              disabled={isToday}
              onClick={() => {
                const next = shiftDateString(day.date, 1);
                select(next >= today ? undefined : next);
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" disabled={isToday} onClick={() => select(undefined)}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Total", formatBytes(dayBytes)],
              ["Download", formatBytes(day.totals.bytesIn)],
              ["Upload", formatBytes(day.totals.bytesOut)],
              ["Time online", day.onlineMs === null ? "-" : formatDuration(day.onlineMs)],
              ["Busiest hour", day.peakHour ? `${day.peakHour.label} · ${formatBytes(day.peakHour.bytes)}` : "-"],
              ["DNS queries", `${day.totals.dnsQueries} (${day.totals.dnsBlocked} blocked)`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="text-sm font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="text-muted-foreground mb-1 text-xs">
              30 days to {format(asDate(day.date), "MMM d")}: {formatBytes(periodBytes)} (estimated from sampled traffic)
            </p>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(value) => formatBytes(Number(value))} />
                  <Tooltip
                    cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                    formatter={(value) => [formatBytes(Number(value)), "Usage"]}
                  />
                  <Bar
                    dataKey="bytes"
                    radius={[3, 3, 0, 0]}
                    className="cursor-pointer"
                    isAnimationActive={false}
                    onClick={(_, index) => {
                      const picked = dailyChart[index]?.date;
                      if (picked) select(picked >= today ? undefined : picked);
                    }}
                  >
                    {dailyChart.map((row) => (
                      <Cell key={row.date} fill={row.date === day.date ? "#0ea5e9" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Hour by hour · {dayLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {dayBytes === 0 ? (
            <p className="text-muted-foreground text-sm">
              No traffic recorded on this day. History comes from the background collector and is
              kept for about 13 months.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(value) => formatBytes(Number(value))}
                  />
                  <Tooltip
                    cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                    formatter={(value, name) => [formatBytes(Number(value)), name]}
                  />
                  <Bar dataKey="download" name="Download" stackId="bytes" fill="#0ea5e9" animationDuration={500} animationEasing="ease-out" />
                  <Bar dataKey="upload" name="Upload" stackId="bytes" fill="#14b8a6" radius={[4, 4, 0, 0]} animationDuration={500} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Online / offline</CardTitle>
          <p className="text-muted-foreground text-xs">Kept for 180 days.</p>
        </CardHeader>
        <CardContent>
          {day.presence.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {day.onlineMs === null
                ? "Nothing recorded for this day."
                : day.onlineMs > 0
                  ? "Online the whole time."
                  : "Offline the whole day."}
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
              {day.presence.map((entry) => (
                <li key={entry.at} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${entry.online ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                    />
                    {entry.online ? "Came online" : "Went offline"}
                  </span>
                  <span className="text-muted-foreground text-xs">{format(new Date(entry.at), "HH:mm")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Top domains · {dayLabel}</CardTitle>
          <p className="text-muted-foreground text-xs">
            {day.totals.dnsQueries} queries, {day.totals.dnsBlocked} blocked. Domains are kept for 90 days
            and counted by UTC day.
          </p>
        </CardHeader>
        <CardContent>
          <AnimatedLeaderboard
            limit={15}
            items={day.domains.map((row) => ({
              id: row.domain,
              label: row.domain,
              value: row.queries,
              extra:
                row.blocked > 0 ? (
                  <Badge variant="destructive" className="shrink-0">
                    {row.blocked} blocked
                  </Badge>
                ) : undefined,
            }))}
            format={(value) => `${Math.round(value)} queries`}
            emptyText="No DNS queries recorded on this day."
          />
        </CardContent>
      </Card>
    </div>
  );
}
