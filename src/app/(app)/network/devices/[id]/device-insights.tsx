"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedLeaderboard } from "@/components/network/animated-leaderboard";
import { getDeviceInsights } from "@/lib/actions/network-insights";
import { formatBytes } from "@/lib/network/format";
import type {
  DeviceDomainStat,
  DeviceUsage,
  PresenceEntry,
} from "@/types/network-insights";

interface Insights {
  usage: DeviceUsage;
  domains: DeviceDomainStat[];
  presence: PresenceEntry[];
}

/** Usage, DNS and presence history recorded by the background collector. */
export function DeviceInsights({ deviceId }: { deviceId: string }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDeviceInsights(deviceId).then((result) => {
      if (cancelled) return;
      if (result.success) setInsights(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const hourlyChart = useMemo(
    () =>
      (insights?.usage.hourly ?? []).map((row) => ({
        label: format(new Date(row.hour), "HH:mm"),
        download: row.bytesIn,
        upload: row.bytesOut,
      })),
    [insights],
  );

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (!insights) {
    return <p className="text-muted-foreground text-sm">Loading usage history…</p>;
  }

  const { usage, domains, presence } = insights;
  const dnsToday = usage.daily.at(-1);
  const hasData = usage.hourly.length > 0 || domains.length > 0 || presence.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage &amp; Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No history yet. The background collector records usage, DNS and
            online/offline changes (run <code className="font-mono">pnpm collector</code>
            {" "}or set <code className="font-mono">NETWORK_COLLECTOR=embedded</code>).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Usage (last 24 hours)</CardTitle>
          <p className="text-muted-foreground text-xs">
            Estimated from sampled traffic. Today {formatBytes(usage.totals.today)} ·
            7 days {formatBytes(usage.totals.last7Days)} · 30 days{" "}
            {formatBytes(usage.totals.last30Days)}
          </p>
        </CardHeader>
        <CardContent>
          {hourlyChart.length === 0 ? (
            <p className="text-muted-foreground text-sm">No traffic recorded in the last 24 hours.</p>
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
                  <Bar dataKey="download" name="Download" stackId="bytes" fill="#0ea5e9" animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="upload" name="Upload" stackId="bytes" fill="#14b8a6" radius={[4, 4, 0, 0]} animationDuration={700} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Online / offline</CardTitle>
        </CardHeader>
        <CardContent>
          {presence.length === 0 ? (
            <p className="text-muted-foreground text-sm">No changes recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {presence.map((entry) => (
                <li key={entry.at} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${entry.online ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                    />
                    {entry.online ? "Came online" : "Went offline"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(entry.at), "MMM d, HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Top domains (last 7 days)</CardTitle>
          {dnsToday && (
            <p className="text-muted-foreground text-xs">
              Today: {dnsToday.dnsQueries} queries, {dnsToday.dnsBlocked} blocked
            </p>
          )}
        </CardHeader>
        <CardContent>
          <AnimatedLeaderboard
            limit={15}
            items={domains.map((row) => ({
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
            emptyText="No DNS queries recorded yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
