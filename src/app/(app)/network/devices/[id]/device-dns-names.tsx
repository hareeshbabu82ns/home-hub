"use client";

import { Globe2, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addDeviceDnsName,
  deleteDeviceDnsName,
  getDeviceDnsNames,
  updateDeviceDnsName,
} from "@/lib/actions/network-control";

type Data = Extract<Awaited<ReturnType<typeof getDeviceDnsNames>>, { success: true }>["data"];
type DnsName = Data["names"][number];

/** DNS names (Unbound host overrides) for one device: list, add, edit, remove. */
export function DeviceDnsNames({
  deviceId,
  deviceName,
  ipAddress,
}: {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // null uuid = adding a new name
  const [editing, setEditing] = useState<{ uuid: string | null; hostname: string; domain: string } | null>(null);
  const [removing, setRemoving] = useState<DnsName | null>(null);

  const load = useCallback(async () => {
    const result = await getDeviceDnsNames(deviceId);
    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;
    void getDeviceDnsNames(deviceId).then((result) => {
      if (cancelled) return;
      if (result.success) setData(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    const result = editing.uuid
      ? await updateDeviceDnsName({ id: deviceId, uuid: editing.uuid, hostname: editing.hostname, domain: editing.domain })
      : await addDeviceDnsName({ id: deviceId, hostname: editing.hostname, domain: editing.domain });
    setBusy(false);
    if (result.success) {
      toast.success(`${result.fqdn} → ${ipAddress}`);
      setEditing(null);
      await load();
    } else {
      toast.error(result.error);
    }
  }

  async function repoint(name: DnsName) {
    setBusy(true);
    const result = await updateDeviceDnsName({ id: deviceId, uuid: name.uuid, hostname: name.hostname, domain: name.domain });
    setBusy(false);
    if (result.success) {
      toast.success(`${name.fqdn} now points to ${ipAddress}`);
      await load();
    } else {
      toast.error(result.error);
    }
  }

  async function remove(name: DnsName) {
    setRemoving(null);
    setBusy(true);
    const result = await deleteDeviceDnsName({ id: deviceId, uuid: name.uuid });
    setBusy(false);
    if (result.success) {
      toast.success(`${name.fqdn} removed`);
      await load();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Globe2 className="size-3" />
          DNS names
        </p>
        {data?.canManage && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            disabled={busy}
            onClick={() =>
              setEditing({ uuid: null, hostname: data.suggestedHostname ?? "", domain: data.routerDomain ?? "" })
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add
          </Button>
        )}
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : !data ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : data.names.length === 0 ? (
        <p className="text-muted-foreground text-sm">None. Add one so the device has a stable name on your network.</p>
      ) : (
        <ul className="space-y-1.5">
          {data.names.map((name) => (
            <li key={name.uuid} className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
              <span className="font-mono">{name.fqdn}</span>
              <span className="text-muted-foreground font-mono text-xs">→ {name.ip}</span>
              {name.stale && (
                <Badge variant="destructive" title={`The device now uses ${ipAddress}`}>
                  old IP
                </Badge>
              )}
              {!name.enabled && <Badge variant="outline">disabled</Badge>}
              {!name.managed && (
                <Badge variant="outline" title="Created on the router, not by Home Hub">
                  router
                </Badge>
              )}
              {data.canManage && (
                <span className="ml-auto flex items-center gap-1">
                  {name.stale && (
                    <Button size="sm" variant="outline" className="h-7 px-2" disabled={busy} onClick={() => void repoint(name)}>
                      <RefreshCw className="mr-1 size-3.5" />
                      Point to {ipAddress}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    aria-label={`Edit ${name.fqdn}`}
                    disabled={busy}
                    onClick={() => setEditing({ uuid: name.uuid, hostname: name.hostname, domain: name.domain })}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-7 px-2"
                    aria-label={`Remove ${name.fqdn}`}
                    disabled={busy}
                    onClick={() => setRemoving(name)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.uuid ? "Edit DNS name" : `Add a DNS name for ${deviceName}`}</DialogTitle>
            <DialogDescription>
              An Unbound host override pointing at {ipAddress}
              {editing?.uuid ? " (saving also re-points it to the current IP)" : ""}. Reserve the IP too, so the
              name keeps working when the lease changes.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dns-hostname">Hostname</Label>
                  <Input
                    id="dns-hostname"
                    value={editing.hostname}
                    onChange={(e) => setEditing({ ...editing, hostname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dns-domain">Domain</Label>
                  <Input
                    id="dns-domain"
                    value={editing.domain}
                    onChange={(e) => setEditing({ ...editing, domain: e.target.value })}
                  />
                </div>
              </div>
              {editing.hostname && editing.domain && (
                <p className="text-muted-foreground font-mono text-xs">
                  {editing.hostname}.{editing.domain} → {ipAddress}
                </p>
              )}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={busy || !editing?.hostname || !editing?.domain} onClick={() => void save()}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing?.uuid ? "Save" : "Add name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.fqdn}?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes the host override on the router and reloads Unbound. The name stops resolving
              {removing && !removing.managed ? "; it was created on the router, not by Home Hub" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => removing && void remove(removing)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
