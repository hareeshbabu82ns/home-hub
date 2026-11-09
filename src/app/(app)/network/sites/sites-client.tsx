"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AddSiteRuleForm, SiteRuleList } from "@/components/network/site-rules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllSiteRules } from "@/lib/actions/network-sites";
import { GLOBAL_SCOPE } from "@/lib/network/site-filter-constants";

type Data = Extract<Awaited<ReturnType<typeof getAllSiteRules>>, { success: true }>["data"];

export function SitesClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getAllSiteRules();
    if (result.success) setData(result.data);
    else setError(result.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getAllSiteRules().then((result) => {
      if (cancelled) return;
      if (result.success) setData(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const status = data.status;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blocked for all devices</CardTitle>
          <CardDescription>
            Applies to every device on the network, on top of the router&apos;s own blocklists. A domain covers
            its subdomains.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.canManage && <AddSiteRuleForm scope={GLOBAL_SCOPE} allowAllowed={false} onChanged={load} />}
          <SiteRuleList
            rules={data.global}
            canManage={data.canManage}
            onChanged={load}
            emptyText="No sites blocked for all devices."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-device rules</CardTitle>
          <CardDescription>
            Add or change these on each device&apos;s page (Websites card).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.devices.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No device has its own rules yet. Open a device from{" "}
              <Link href="/network/devices" className="text-primary hover:underline">
                Devices
              </Link>{" "}
              to add some.
            </p>
          ) : (
            data.devices.map((device) => (
              <div key={device.deviceId} className="rounded-lg border p-3">
                <Link href={`/network/devices/${device.deviceId}`} className="font-medium hover:underline">
                  {device.name}
                </Link>
                {status?.inactiveDevices.includes(device.name) && (
                  <span className="ml-2 text-xs text-amber-600">paused: no current address</span>
                )}
                <div className="mt-2">
                  <SiteRuleList rules={device.rules} canManage={data.canManage} onChanged={load} emptyText="" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-5" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Rules are enforced by the router&apos;s DNS resolver (Unbound DNSBL): blocked sites resolve to
            0.0.0.0, so they don&apos;t load. Changes apply within seconds; a device may keep a cached answer for a
            few minutes.
          </p>
          <p>
            DNS filtering only works for devices that use the router for DNS. Browsers with &ldquo;secure DNS&rdquo;
            (DNS over HTTPS), VPNs or iCloud Private Relay can bypass it; turn those off on kids&apos; devices.
          </p>
          <p>
            Per-device rules follow the device&apos;s current address. Give kids&apos; devices a DHCP reservation
            (device page → Reserve IP) so rules don&apos;t move when leases change.
          </p>
          {status && (
            <p className="text-xs">
              Last synced with the router {formatDistanceToNowStrict(new Date(status.at), { addSuffix: true })}
              {status.errors.length ? ` · errors: ${status.errors.join("; ")}` : ""}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
