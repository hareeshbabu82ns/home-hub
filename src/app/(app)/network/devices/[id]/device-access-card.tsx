"use client";

import { format } from "date-fns";
import { Ban, CheckCircle2, Loader2, Pause, Pin, Play, Power } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleNetworkDeviceBlocked } from "@/lib/actions/network";
import {
  getDeviceControlOptions,
  getNetworkAuditLog,
  pauseDevice,
  reserveDeviceIp,
  wakeDevice,
} from "@/lib/actions/network-control";
import { describeReason } from "@/lib/network/access-policy";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import type { NetworkDevice } from "@/types/network";

import { DeviceQuotaControl } from "./device-quota-control";

type Options = Extract<Awaited<ReturnType<typeof getDeviceControlOptions>>, { success: true }>["data"];
type AuditEntry = Extract<Awaited<ReturnType<typeof getNetworkAuditLog>>, { success: true }>["data"][number];

type Pending =
  | { kind: "block" | "unblock" | "reserve" | "wake" }
  | { kind: "pause"; minutes: number }
  | { kind: "confirm-self"; retry: "block" | { pause: number }; message: string };

const PAUSE_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 240, label: "4 hours" },
];

export function DeviceAccessCard({
  device,
  onChanged,
}: {
  device: NetworkDevice;
  onChanged: () => void | Promise<void>;
}) {
  const [options, setOptions] = useState<Options | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [dnsForm, setDnsForm] = useState({ hostname: "", domain: "" });

  const loadAudit = useCallback(async () => {
    const result = await getNetworkAuditLog({ deviceId: device.id, limit: 10 });
    if (result.success) setAudit(result.data);
  }, [device.id]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getDeviceControlOptions(device.id), getNetworkAuditLog({ deviceId: device.id, limit: 10 })]).then(
      ([opts, log]) => {
        if (cancelled) return;
        if (opts.success) {
          setOptions(opts.data);
          setDnsForm({ hostname: opts.data.suggestedHostname ?? "", domain: opts.data.routerDomain ?? "" });
        }
        if (log.success) setAudit(log.data);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [device.id]);

  const name = getDeviceDisplayName(device);
  const macMode = options?.mode === "mac";
  const exempt = device.access?.exempt ?? null;
  const paused = device.access?.reasons.some((reason) => reason.kind === "paused") ?? false;

  async function finish(ok: boolean, message?: string, error?: string) {
    setBusy(false);
    if (ok) {
      if (message) toast.success(message);
      await onChanged();
      await loadAudit();
    } else if (error) {
      toast.error(error);
    }
  }

  async function run(action: Pending, confirmSelf = false) {
    setPending(null);
    setBusy(true);

    if (action.kind === "block" || action.kind === "unblock" || (action.kind === "confirm-self" && action.retry === "block")) {
      const isBlocked = action.kind !== "unblock";
      const result = await toggleNetworkDeviceBlocked({ id: device.id, isBlocked, confirmSelf });
      if (!result.success && "requiresConfirmation" in result && result.requiresConfirmation) {
        setBusy(false);
        setPending({ kind: "confirm-self", retry: "block", message: result.error ?? "" });
        return;
      }
      if (result.success && "notice" in result && result.notice) toast.info(result.notice);
      return finish(result.success, isBlocked ? `${name} blocked` : `${name} unblocked`, result.error);
    }

    if (action.kind === "pause" || action.kind === "confirm-self") {
      const minutes = action.kind === "pause" ? action.minutes : (action.retry as { pause: number }).pause;
      const result = await pauseDevice({ id: device.id, minutes, confirmSelf });
      if (!result.success && "requiresConfirmation" in result && result.requiresConfirmation) {
        setBusy(false);
        setPending({ kind: "confirm-self", retry: { pause: minutes }, message: result.error });
        return;
      }
      return finish(
        result.success,
        minutes ? `${name} paused for ${PAUSE_OPTIONS.find((o) => o.minutes === minutes)?.label}` : `${name} resumed`,
        result.success ? undefined : result.error,
      );
    }

    if (action.kind === "reserve") {
      const result = await reserveDeviceIp({ id: device.id, hostname: dnsForm.hostname || undefined });
      return finish(result.success, result.success ? `Reserved ${result.ip} for ${name}` : undefined, result.success ? undefined : result.error);
    }

    if (action.kind === "wake") {
      const result = await wakeDevice(device.id);
      return finish(result.success, `Wake-on-LAN sent to ${name}`, result.success ? undefined : result.error);
    }
  }

  const dialog = (() => {
    if (!pending) return null;
    switch (pending.kind) {
      case "block":
        return {
          title: `Block ${name}?`,
          body: macMode
            ? `Blocks ${device.macAddress} on every address it uses (IPv4 and IPv6) and drops its open connections.`
            : `Adds ${device.ipAddress} to the router's Blocked_Devices alias.`,
          confirm: "Block",
          destructive: true,
        };
      case "unblock":
        return { title: `Unblock ${name}?`, body: "Restores network access (unless a schedule or quarantine still applies).", confirm: "Unblock", destructive: false };
      case "pause":
        return {
          title: `Pause ${name}?`,
          body: `No network access for ${PAUSE_OPTIONS.find((o) => o.minutes === pending.minutes)?.label}. Access returns automatically.`,
          confirm: "Pause",
          destructive: true,
        };
      case "reserve":
        return {
          title: `Reserve ${device.ipAddress} for ${name}?`,
          body: `Adds a Dnsmasq DHCP reservation so ${device.macAddress} always gets ${device.ipAddress}${dnsForm.hostname ? ` with hostname "${dnsForm.hostname}"` : ""}, and reloads Dnsmasq.`,
          confirm: "Reserve",
          destructive: false,
        };
      case "wake":
        return { title: `Wake ${name}?`, body: `Sends a Wake-on-LAN packet to ${device.macAddress}.`, confirm: "Wake", destructive: false };
      case "confirm-self":
        return { title: "Cut off your own access?", body: pending.message, confirm: "Continue anyway", destructive: true };
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>Access &amp; actions</span>
          {device.isBlocked ? (
            <Badge variant="destructive" className="gap-1">
              <Ban className="size-3" /> No access
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-3" /> Allowed
            </Badge>
          )}
        </CardTitle>
        {device.access?.reasons.length ? (
          <div className="flex flex-wrap gap-1">
            {device.access.reasons.map((reason) => (
              <Badge key={JSON.stringify(reason)} variant="outline">
                {describeReason(reason)}
              </Badge>
            ))}
          </div>
        ) : null}
        {exempt && <p className="text-muted-foreground text-sm">{exempt}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        {!options ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : !options.canManage ? (
          <p className="text-muted-foreground text-sm">Read-only. Ask an admin to change access.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {!exempt && (
                <Button
                  variant={device.isBlocked ? "secondary" : "destructive"}
                  size="sm"
                  disabled={busy}
                  onClick={() => setPending({ kind: device.access?.reasons.some((r) => r.kind === "manual") || (!macMode && device.isBlocked) ? "unblock" : "block" })}
                >
                  <Ban className="mr-1 size-4" />
                  {device.access?.reasons.some((r) => r.kind === "manual") || (!macMode && device.isBlocked) ? "Unblock" : "Block"}
                </Button>
              )}
              {!exempt && macMode && !paused &&
                PAUSE_OPTIONS.map((option) => (
                  <Button key={option.minutes} variant="outline" size="sm" disabled={busy} onClick={() => setPending({ kind: "pause", minutes: option.minutes })}>
                    <Pause className="mr-1 size-4" />
                    Pause {option.label}
                  </Button>
                ))}
              {macMode && paused && (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => void run({ kind: "pause", minutes: 0 })}>
                  <Play className="mr-1 size-4" />
                  Resume now
                </Button>
              )}
            </div>
            {!macMode && !exempt && (
              <p className="text-muted-foreground text-xs">
                Pause, schedules and quarantine need MAC control: Settings → Network → Router control.
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <span title={options.wolAvailable ? undefined : "Install the os-wol plugin on the router"}>
                <Button variant="outline" size="sm" disabled={busy || !options.wolAvailable} onClick={() => setPending({ kind: "wake" })}>
                  <Power className="mr-1 size-4" />
                  Wake
                </Button>
              </span>
              {device.role === "CLIENT" && !device.isUpstream && (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => setPending({ kind: "reserve" })}>
                  <Pin className="mr-1 size-4" />
                  Reserve {device.ipAddress}
                </Button>
              )}
            </div>

            {device.role === "CLIENT" && !device.isUpstream && (
              <DeviceQuotaControl
                deviceId={device.id}
                dailyQuotaMB={device.dailyQuotaMB}
                quotaAction={device.quotaAction}
                macMode={macMode}
                onChanged={async () => {
                  await onChanged();
                  await loadAudit();
                }}
              />
            )}
          </>
        )}

        {audit.length > 0 && (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">History</p>
            <ul className="space-y-1 text-xs">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                  <span className={`break-words ${entry.success ? "" : "text-destructive"}`}>
                    {entry.action}
                    {entry.target ? ` · ${entry.target}` : ""}
                    {entry.success ? "" : ` (failed: ${entry.error})`}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {entry.actor} · {format(new Date(entry.at), "MMM d, HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={dialog?.destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
              onClick={() => pending && void run(pending, pending.kind === "confirm-self")}
            >
              {dialog?.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}
