"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
import { getRouterHealth } from "@/lib/actions/network-insights";
import { formatRateBits } from "@/lib/network/format";
import type { CollectorStatus, RouterHealthReport } from "@/types/network-insights";

const REFRESH_MS = 60_000;

function pct(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : `${value.toFixed(1)}%`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function RouterHealthClient() {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<{ status: CollectorStatus; report: RouterHealthReport } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getRouterHealth(hours);
    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [hours]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const loop = async () => {
      await load();
      if (!cancelled) timer = setTimeout(loop, REFRESH_MS);
    };
    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  const series = useMemo(
    () =>
      (data?.report.series ?? []).map((row) => ({
        label: format(new Date(row.timestamp), "HH:mm"),
        cpu: row.cpuPct,
        memory: row.memUsedPct,
        // Interface counters are bytes/s; charts show bits/s like the router.
        wanDown: row.wanRxBps === null ? null : row.wanRxBps * 8,
        wanUp: row.wanTxBps === null ? null : row.wanTxBps * 8,
      })),
    [data],
  );

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  const { status, report } = data;
  const info = report.info;
  const wan = info?.interfaces.find((i) => i.key === "wan");

  if (!info) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
        No router data yet. Start the background collector with{" "}
        <code className="font-mono">pnpm collector</code> or set{" "}
        <code className="font-mono">NETWORK_COLLECTOR=embedded</code>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!status.running && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          The collector isn&apos;t running; figures are from{" "}
          {report.infoAt ? formatDistanceToNowStrict(new Date(report.infoAt), { addSuffix: true }) : "earlier"}.
        </div>
      )}
      {status.lastError && (
        <p className="text-destructive text-sm">Last collector error: {status.lastError}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {info.name ?? "Router"}
            {info.version && <Badge variant="secondary">{info.version}</Badge>}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {[info.os, info.uptime && `up ${info.uptime}`, info.loadavg && `load ${info.loadavg}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="CPU" value={pct(info.cpuPct)} />
        <Stat
          label="Memory"
          value={pct(info.memory?.usedPct)}
          hint={
            info.memory
              ? `${(info.memory.usedBytes / 2 ** 30).toFixed(1)} of ${(info.memory.totalBytes / 2 ** 30).toFixed(1)} GiB`
              : undefined
          }
        />
        <Stat
          label="Disk (/)"
          value={info.disk?.usedPct === undefined ? "-" : `${info.disk.usedPct}%`}
          hint={info.disk?.used && info.disk.size ? `${info.disk.used} of ${info.disk.size}` : undefined}
        />
        <Stat
          label="WAN now"
          value={wan?.rxBps == null ? "-" : `↓ ${formatRateBits(wan.rxBps * 8)}`}
          hint={wan?.txBps == null ? undefined : `↑ ${formatRateBits(wan.txBps * 8)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gateways</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {info.gateways.length === 0 ? (
              <p className="text-muted-foreground text-sm">No gateways reported.</p>
            ) : (
              info.gateways.map((gateway) => (
                <div key={gateway.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{gateway.name}</p>
                    <p className="text-muted-foreground font-mono text-xs">{gateway.address}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={/online/i.test(gateway.status) ? "secondary" : "destructive"}>
                      {gateway.status}
                    </Badge>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {gateway.delayMs === null || gateway.delayMs === undefined
                        ? "Latency monitoring off"
                        : `${gateway.delayMs.toFixed(1)} ms · ${gateway.lossPct ?? 0}% loss`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interfaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {info.interfaces.map((iface) => (
              <div key={iface.key} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{iface.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {iface.key} · {iface.device}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p>↓ {iface.rxBps == null ? "-" : formatRateBits(iface.rxBps * 8)}</p>
                  <p className="text-muted-foreground text-xs">
                    ↑ {iface.txBps == null ? "-" : formatRateBits(iface.txBps * 8)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>History</CardTitle>
          <Select value={String(hours)} onValueChange={(value) => setHours(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          {series.length < 2 ? (
            <p className="text-muted-foreground text-sm lg:col-span-2">
              History builds up as the collector runs (one sample per minute).
            </p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">WAN throughput</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={72}
                        tickFormatter={(value) => formatRateBits(Number(value))}
                      />
                      <Tooltip formatter={(value, name) => [formatRateBits(Number(value)), name]} />
                      <Legend />
                      <Area type="monotone" dataKey="wanDown" name="Download" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} isAnimationActive={false} />
                      <Area type="monotone" dataKey="wanUp" name="Upload" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">CPU and memory</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} width={40} domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(value, name) => [pct(Number(value)), name]} />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" name="CPU" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="memory" name="Memory" stroke="#6366f1" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
