"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2, CircleDashed, Loader2, ShieldCheck } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getRouterControl,
  prepareRouterControl,
  setQuarantineNewDevices,
} from "@/lib/actions/network-control";

type ControlData = Extract<Awaited<ReturnType<typeof getRouterControl>>, { success: true }>["data"];

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      ) : (
        <CircleDashed className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      )}
      <span>{children}</span>
    </li>
  );
}

export function RouterControlCard() {
  const [data, setData] = useState<ControlData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await getRouterControl();
    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getRouterControl().then((result) => {
      if (cancelled) return;
      if (result.success) setData(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function prepare() {
    setConfirmOpen(false);
    setBusy(true);
    const result = await prepareRouterControl();
    setBusy(false);
    if (result.success) {
      const { created, migrated } = result.data;
      toast.success(
        created.length
          ? `Router prepared: created ${created.join(", ")}${migrated.length ? `; moved ${migrated.length} blocked device(s)` : ""}`
          : "Router already prepared; MAC control enabled",
      );
      await load();
    } else {
      toast.error(result.error);
    }
  }

  async function toggleQuarantine(enabled: boolean) {
    setBusy(true);
    const result = await setQuarantineNewDevices(enabled);
    setBusy(false);
    if (result.success) {
      toast.success(enabled ? "New devices will be quarantined until reviewed" : "Quarantine turned off");
      await load();
    } else {
      toast.error(result.error);
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Router control
          </CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const { setup, mode, enforcement } = data;
  const ready = !!setup.alias && setup.alias.type === "mac" && !!setup.rule?.enabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          Router control
          <Badge variant={mode === "mac" ? "secondary" : "outline"}>
            {mode === "mac" ? "MAC control" : "Legacy IP blocking"}
          </Badge>
        </CardTitle>
        <CardDescription>
          MAC control blocks devices by hardware address (IPv4 and IPv6), so a new
          DHCP lease can&apos;t get around a block. It also enables pause,
          schedules and quarantine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1.5">
          <Check ok={!!setup.alias && setup.alias.type === "mac"}>
            Alias <code className="font-mono">HH_Block</code> (type MAC)
            {setup.alias ? ` — ${setup.alias.macCount} device(s)` : " — not created"}
          </Check>
          <Check ok={!!setup.rule?.enabled}>
            Floating block rule for <code className="font-mono">HH_Block</code>, IPv4+IPv6
            {setup.rule ? (setup.rule.enabled ? "" : " — disabled") : " — not created"}
          </Check>
          <Check ok={mode === "mac"}>Home Hub uses MAC control</Check>
          <Check ok={setup.wolAvailable}>
            Wake-on-LAN {setup.wolAvailable ? "available" : "needs the os-wol plugin on the router"}
          </Check>
        </ul>

        {setup.legacyBlockedIps.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {setup.legacyBlockedIps.length} address(es) are blocked through the old{" "}
            <code className="font-mono">Blocked_Devices</code> alias; preparing moves them to MAC
            blocks.
          </p>
        )}

        {data.canManage && (mode !== "mac" || !ready) && (
          <Button onClick={() => setConfirmOpen(true)} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Prepare router
          </Button>
        )}

        {mode === "mac" && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Quarantine new devices</p>
              <p className="text-muted-foreground text-xs">
                Devices seen for the first time have no network access until you
                mark them reviewed.
              </p>
            </div>
            <Switch
              checked={data.quarantineNewDevices}
              disabled={!data.canManage || busy}
              onCheckedChange={(checked) => void toggleQuarantine(checked)}
            />
          </div>
        )}

        {mode === "mac" && (
          <p className="text-muted-foreground text-xs">
            Schedules use the {data.timeZone} timezone.{" "}
            {enforcement
              ? `Last enforced ${formatDistanceToNowStrict(new Date(enforcement.at), { addSuffix: true })}: ${enforcement.blockedDevices} device(s) blocked${enforcement.errors.length ? `, ${enforcement.errors.length} error(s)` : ""}.`
              : "Not enforced yet; the collector applies changes every minute."}
          </p>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prepare the router for MAC control?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Home Hub will make these changes on the router and apply them:</p>
                <ul className="list-disc space-y-1 pl-5">
                  {!setup.alias && (
                    <li>
                      Create an empty MAC alias <code className="font-mono">HH_Block</code>.
                    </li>
                  )}
                  {!setup.rule && (
                    <li>
                      Add a floating rule: block, quick, IPv4+IPv6, source{" "}
                      <code className="font-mono">HH_Block</code>, logged. It matches nothing until a
                      device is blocked.
                    </li>
                  )}
                  {setup.rule && !setup.rule.enabled && <li>Re-enable the existing Home Hub block rule.</li>}
                  {setup.legacyBlockedIps.length > 0 && (
                    <li>
                      Move {setup.legacyBlockedIps.length} blocked address(es) from{" "}
                      <code className="font-mono">Blocked_Devices</code> to MAC blocks.
                    </li>
                  )}
                </ul>
                <p>Your existing rules and aliases are not changed otherwise.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void prepare()}>Prepare router</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
