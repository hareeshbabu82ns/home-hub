"use client";

import { Loader2, RefreshCw, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { closeDeviceConnections, getDeviceConnections, type DeviceConnection } from "@/lib/actions/network-monitoring";
import { formatBytes } from "@/lib/network/format";

/** Live firewall states (open connections) for one device. */
export function DeviceConnectionsCard({ deviceId, name }: { deviceId: string; name: string }) {
  const [rows, setRows] = useState<DeviceConnection[] | null>(null);
  const [total, setTotal] = useState(0);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<DeviceConnection | "all" | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    const result = await getDeviceConnections(deviceId);
    setBusy(false);
    if (result.success) {
      setRows(result.data.rows);
      setTotal(result.data.total);
      setCanManage(result.data.canManage);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;
    void getDeviceConnections(deviceId).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setRows(result.data.rows);
        setTotal(result.data.total);
        setCanManage(result.data.canManage);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  async function close(target: DeviceConnection | "all") {
    setPending(null);
    setBusy(true);
    const result = await closeDeviceConnections({
      deviceId,
      stateId: target === "all" ? undefined : target.id,
    });
    setBusy(false);
    if (result.success) {
      toast.success(target === "all" ? `Closed ${result.dropped} connection(s)` : "Connection closed");
      await load();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Open connections</CardTitle>
          <p className="text-muted-foreground text-xs">
            Firewall states through the router right now{rows ? ` (${rows.length} of ${total} matching)` : ""}.
            Closing one forces the device to reconnect.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void load()}>
            {busy ? <Loader2 className="mr-1 size-4 animate-spin" /> : <RefreshCw className="mr-1 size-4" />}
            Refresh
          </Button>
          {canManage && rows && rows.length > 0 && (
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => setPending("all")}>
              Close all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : !rows ? (
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open connections through the router.</p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proto</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Bytes</TableHead>
                  {canManage && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="uppercase">{row.proto}</TableCell>
                    <TableCell className="font-mono text-xs">{row.src}</TableCell>
                    <TableCell className="font-mono text-xs">{row.dst}</TableCell>
                    <TableCell className="text-xs">{row.state}</TableCell>
                    <TableCell className="text-xs">{row.age}</TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap">
                      {formatBytes(row.bytesIn + row.bytesOut)}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Close connection"
                          disabled={busy}
                          onClick={() => setPending(row)}
                        >
                          <X className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "all" ? `Close all of ${name}'s connections?` : "Close this connection?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending === "all"
                ? "Every open connection through the router is dropped; the device reconnects unless it is blocked."
                : pending
                  ? `${pending.proto.toUpperCase()} ${pending.src} → ${pending.dst} is dropped; the device may reconnect.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => pending && void close(pending)}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
