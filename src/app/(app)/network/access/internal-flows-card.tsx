"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Loader2, Network, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInternalFlowsReport } from "@/lib/actions/network-monitoring";

type Report = Extract<Awaited<ReturnType<typeof getInternalFlowsReport>>, { success: true }>["data"];

/**
 * Which LAN devices open connections into other private networks (the
 * upstream network, VPN peers…). Same-LAN traffic is switched directly and is
 * invisible to the router, so true isolation needs a separate IoT VLAN.
 */
export function InternalFlowsCard() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getInternalFlowsReport(7).then((result) => {
      if (cancelled) return;
      if (result.success) setReport(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="size-5" />
          Internal connections (7 days)
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          LAN devices reaching other private networks through the router, sampled every 5 minutes.
          Devices on the same LAN talk directly through the switch, so the router can&apos;t see or
          stop that traffic; isolating IoT devices needs a separate VLAN.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : !report ? (
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        ) : report.sources.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No internal cross-network connections seen yet. The collector samples them every 5 minutes.
          </p>
        ) : (
          report.sources.map((source) => (
            <div key={source.deviceId} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/network/devices/${source.deviceId}`} className="font-medium hover:underline">
                  {source.name}
                </Link>
                {source.deviceType && <Badge variant="outline">{source.deviceType}</Badge>}
                {source.flagged && (
                  <Badge variant="destructive" className="gap-1">
                    <TriangleAlert className="size-3" />
                    IoT-type device
                  </Badge>
                )}
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {source.flows.slice(0, 12).map((flow) => (
                  <li key={`${flow.dstIp}-${flow.proto}-${flow.port}`} className="flex justify-between gap-2">
                    <span className="font-mono">
                      → {flow.dstName ? `${flow.dstName} (${flow.dstIp})` : flow.dstIp} {flow.proto.toUpperCase()}/{flow.port}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      seen {flow.samples}× · {formatDistanceToNowStrict(new Date(flow.lastSeenAt), { addSuffix: true })}
                    </span>
                  </li>
                ))}
                {source.flows.length > 12 && (
                  <li className="text-muted-foreground">+{source.flows.length - 12} more</li>
                )}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
