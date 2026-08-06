"use client";

import { format, fromUnixTime } from "date-fns";
import { ArrowLeft, Ban, CheckCircle2, RefreshCw, Router } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getNetworkDeviceDetails,
  getNetworkDeviceDnsQueries,
} from "@/lib/actions/network";
import type {
  NetworkDevice,
  NetworkDnsQueryResult,
  NetworkDnsQueryRow,
} from "@/types/network";

interface NetworkDeviceDetailPageProps {
  deviceId: string;
}

const DNS_ACTION_ALL = "__ALL__";
const DNS_AUTO_REFRESH_DEFAULT_MS = 10_000;

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return format(parsed, "yyyy-MM-dd HH:mm:ss");
}

function formatDnsTime(unixTime: number): string {
  if (!Number.isFinite(unixTime) || unixTime <= 0) {
    return "-";
  }

  const inSeconds = unixTime > 1_000_000_000_000 ? unixTime / 1000 : unixTime;
  return format(fromUnixTime(Math.floor(inSeconds)), "yyyy-MM-dd HH:mm:ss");
}

function DnsQueryRows({ rows }: { rows: NetworkDnsQueryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No DNS queries found for this IP.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>RCode</TableHead>
            <TableHead>Resolve (ms)</TableHead>
            <TableHead>TTL</TableHead>
            <TableHead>DNSSEC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.uuid || row.domain}-${row.time}-${index}`}>
              <TableCell className="text-xs whitespace-nowrap">
                {formatDnsTime(row.time)}
              </TableCell>
              <TableCell className="max-w-72 truncate font-mono text-xs">
                {row.domain || "-"}
              </TableCell>
              <TableCell>{row.type || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={row.action === "Pass" ? "secondary" : "destructive"}
                >
                  {row.action || "-"}
                </Badge>
              </TableCell>
              <TableCell>{row.source || "-"}</TableCell>
              <TableCell>{row.rcode || "-"}</TableCell>
              <TableCell>{row.resolveTimeMs}</TableCell>
              <TableCell>{row.ttl}</TableCell>
              <TableCell>{row.dnssecStatus || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function NetworkDeviceDetailPage({
  deviceId,
}: NetworkDeviceDetailPageProps) {
  const [device, setDevice] = useState<NetworkDevice | null>(null);
  const [dnsQueries, setDnsQueries] = useState<NetworkDnsQueryResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState("");
  const [actionFilter, setActionFilter] = useState(DNS_ACTION_ALL);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshIntervalMs, setAutoRefreshIntervalMs] = useState(
    DNS_AUTO_REFRESH_DEFAULT_MS,
  );
  const dnsRequestInFlightRef = useRef(false);

  const loadDnsQueries = useCallback(async () => {
    if (dnsRequestInFlightRef.current) {
      return;
    }

    dnsRequestInFlightRef.current = true;
    setDnsLoading(true);

    const selectedAction =
      actionFilter === DNS_ACTION_ALL ? undefined : actionFilter;

    const result = await getNetworkDeviceDnsQueries({
      id: deviceId,
      current: 1,
      rowCount: 50,
      action: selectedAction,
    });

    try {
      if (result.success && result.data) {
        setDnsQueries(result.data);
      } else {
        setDnsQueries(null);
        toast.error(result.error || "Failed to load DNS queries");
      }
    } finally {
      dnsRequestInFlightRef.current = false;
      setDnsLoading(false);
    }
  }, [actionFilter, deviceId]);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setPageError(null);

    const result = await getNetworkDeviceDetails(deviceId);

    if (result.success && result.device) {
      setDevice(result.device as NetworkDevice);
    } else {
      setPageError(result.error || "Failed to load device details");
      setDevice(null);
      setDnsQueries(null);
    }

    setLoading(false);
  }, [deviceId, loadDnsQueries]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!device) {
      return;
    }

    void loadDnsQueries();
  }, [actionFilter, device, loadDnsQueries]);

  useEffect(() => {
    if (!device || !autoRefreshEnabled) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadDnsQueries();
    }, autoRefreshIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefreshEnabled, autoRefreshIntervalMs, device, loadDnsQueries]);

  const filteredDnsRows = useMemo(() => {
    const rows = dnsQueries?.rows || [];
    const normalizedDomainFilter = domainFilter.trim().toLowerCase();

    if (!normalizedDomainFilter) {
      return rows;
    }

    return rows.filter((row) =>
      row.domain.toLowerCase().includes(normalizedDomainFilter),
    );
  }, [dnsQueries?.rows, domainFilter]);

  const dnsStats = useMemo(() => {
    const grouped = new Map<
      string,
      { domain: string; action: string; count: number }
    >();

    for (const row of filteredDnsRows) {
      const domain = row.domain || "-";
      const action = row.action || "-";
      const key = `${domain}__${action}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
        continue;
      }

      grouped.set(key, { domain, action, count: 1 });
    }

    return Array.from(grouped.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.domain.localeCompare(b.domain);
    });
  }, [filteredDnsRows]);

  if (loading) {
    return (
      <main className="space-y-6 p-4">
        <p className="text-muted-foreground py-8 text-center">
          Loading device details...
        </p>
      </main>
    );
  }

  if (pageError || !device) {
    return (
      <main className="space-y-4 p-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/network/devices">
            <ArrowLeft className="mr-2 size-4" />
            Back to devices
          </Link>
        </Button>
        <p className="text-destructive text-sm">
          {pageError || "Device not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/network/devices">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>

        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-cyan-500">
          <Router className="size-5 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            {device.name || device.hostname || "Unknown Device"}
          </h1>
          <p className="text-muted-foreground text-sm">{device.ipAddress}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Device Details (Database)</span>
            {device.isBlocked ? (
              <Badge variant="destructive" className="gap-1">
                <Ban className="size-3" />
                Blocked
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3" />
                Allowed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">ID</p>
              <p className="font-mono text-xs break-all">{device.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Name</p>
              <p>{device.name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Hostname</p>
              <p>{device.hostname || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">IP Address</p>
              <p className="font-mono text-xs">{device.ipAddress}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">MAC Address</p>
              <p className="font-mono text-xs">{device.macAddress || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Vendor</p>
              <p>{device.vendor || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Device Type</p>
              <p>{device.deviceType || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Interface</p>
              <p>{device.intf || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                Interface Description
              </p>
              <p>{device.intfDescription || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Is New</p>
              <p>{device.isNew ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">First Seen</p>
              <p>{formatDateTime(device.firstSeenAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last Seen</p>
              <p>{formatDateTime(device.lastSeenAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Created At</p>
              <p>{formatDateTime(device.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Updated At</p>
              <p>{formatDateTime(device.updatedAt)}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-xs">Notes</p>
              <p>{device.notes || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>DNS Search Queries</span>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(autoRefreshIntervalMs)}
                onValueChange={(value) =>
                  setAutoRefreshIntervalMs(Number(value))
                }
              >
                <SelectTrigger
                  className="w-35"
                  aria-label="Auto refresh interval"
                >
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                  <SelectItem value="60000">1 minute</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={autoRefreshEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefreshEnabled((previous) => !previous)}
              >
                Auto Refresh: {autoRefreshEnabled ? "On" : "Off"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadDnsQueries()}
                disabled={dnsLoading}
              >
                <RefreshCw
                  className={`mr-2 size-4 ${dnsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Input
              placeholder="Filter by domain (e.g. google.com)"
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DNS_ACTION_ALL}>All actions</SelectItem>
                <SelectItem value="Pass">Pass</SelectItem>
                <SelectItem value="Block">Block</SelectItem>
                <SelectItem value="Deny">Deny</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dnsQueries && (
            <p className="text-muted-foreground text-xs">
              Showing {filteredDnsRows.length} filtered records out of{" "}
              {dnsQueries.rows.length} loaded ({dnsQueries.total} total on
              router) for client {device.ipAddress}.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium">Per-Domain Action Stats</p>
            {dnsStats.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No domain/action stats available for current filters.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dnsStats.map((stat) => (
                      <TableRow key={`${stat.domain}-${stat.action}`}>
                        <TableCell className="max-w-72 truncate font-mono text-xs">
                          {stat.domain}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              stat.action === "Pass"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {stat.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stat.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {dnsLoading && !dnsQueries ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Loading DNS queries...
            </p>
          ) : (
            <DnsQueryRows rows={filteredDnsRows} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
