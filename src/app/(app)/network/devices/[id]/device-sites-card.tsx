"use client";

import { Globe, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AddSiteRuleForm, SiteRuleList } from "@/components/network/site-rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceSiteRules } from "@/lib/actions/network-sites";

type Data = Extract<Awaited<ReturnType<typeof getDeviceSiteRules>>, { success: true }>["data"];

/** Per-device website rules (block / allow), like Access & actions. */
export function DeviceSitesCard({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getDeviceSiteRules(deviceId);
    if (result.success) setData(result.data);
    else setError(result.error);
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;
    void getDeviceSiteRules(deviceId).then((result) => {
      if (cancelled) return;
      if (result.success) setData(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  if (data && !data.eligible) return null; // router/gateway and WAN-side devices

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-5" />
          Websites
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Block sites for this device only, or allow a site that&apos;s blocked for all devices. A domain
          covers its subdomains (youtube.com includes m.youtube.com).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : !data ? (
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        ) : (
          <>
            {data.canManage && <AddSiteRuleForm scope={deviceId} allowAllowed onChanged={load} />}
            {data.inactive && (
              <p className="text-sm text-amber-600">
                This device has no current address, so its rules are paused until it&apos;s back online.
              </p>
            )}
            <SiteRuleList
              rules={data.device}
              canManage={data.canManage}
              onChanged={load}
              emptyText="No rules for this device."
            />
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs">
                Also blocked for all devices (
                <Link href="/network/sites" className="hover:underline">
                  manage
                </Link>
                )
              </p>
              <SiteRuleList rules={data.global} canManage={false} onChanged={load} emptyText="None." />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
