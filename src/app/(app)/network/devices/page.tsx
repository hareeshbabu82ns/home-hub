"use client";

import { format } from "date-fns";
import {
  Check,
  Lock,
  MoreHorizontal,
  Pencil,
  Router,
  Search,
  Trash2,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNetworkDevices } from "@/hooks/use-network-devices";
import { getUsageToday } from "@/lib/actions/network-insights";
import { formatBytes } from "@/lib/network/format";
import {
  getDeviceDisplayName,
  hasRealDeviceName,
} from "@/lib/network/device-display";
import type { NetworkDevice } from "@/types/network";

import {
  blockDisabledReason,
  DeviceBadges,
  OnlineDot,
} from "../components/device-badges";

const defaultEditState = {
  id: "",
  name: "",
  hostname: "",
  vendor: "",
  deviceType: "",
  notes: "",
};

type PendingAction =
  | { kind: "block" | "unblock" | "delete"; device: NetworkDevice }
  | { kind: "block-self"; device: NetworkDevice; message: string };

export default function NetworkDevicesPage() {
  const {
    devices,
    canManage,
    loading,
    actionLoading,
    search,
    setSearch,
    loadDevices,
    scanDevices,
    saveDevice,
    removeDevice,
    markReviewed,
    toggleBlocked,
  } = useNetworkDevices();

  const [subnet, setSubnet] = useState("");
  const [showInfrastructure, setShowInfrastructure] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<NetworkDevice | null>(null);
  const [editState, setEditState] = useState(defaultEditState);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [usageToday, setUsageToday] = useState<Record<string, number>>({});

  useEffect(() => {
    void loadDevices();
    void getUsageToday().then((result) => {
      if (result.success) setUsageToday(result.data);
    });
  }, [loadDevices]);

  const infrastructureCount = useMemo(
    () => devices.filter((device) => device.role === "INFRASTRUCTURE").length,
    [devices],
  );
  const onlineCount = useMemo(
    () => devices.filter((device) => device.isOnline).length,
    [devices],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return devices.filter((device) => {
      if (!showInfrastructure && device.role === "INFRASTRUCTURE") {
        return false;
      }
      if (!query) return true;
      return [
        device.name,
        device.hostname,
        device.dhcpHostname,
        device.ipAddress,
        device.macAddress,
        device.vendor,
        device.deviceType,
        device.intfDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [devices, search, showInfrastructure]);

  function openEdit(device: NetworkDevice) {
    setEditDevice(device);
    setEditState({
      id: device.id,
      name: device.name || "",
      hostname: device.hostname || "",
      vendor: device.vendor || "",
      deviceType: device.deviceType || "",
      notes: device.notes || "",
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    const success = await saveDevice({
      id: editState.id,
      name: editState.name || undefined,
      hostname: editState.hostname || undefined,
      vendor: editState.vendor || undefined,
      deviceType: editState.deviceType || undefined,
      notes: editState.notes || undefined,
    });

    if (success) {
      setEditOpen(false);
      setEditState(defaultEditState);
    }
  }

  async function runPendingAction() {
    if (!pending) return;
    const { device } = pending;
    setPending(null);

    if (pending.kind === "delete") {
      await removeDevice(device.id);
      return;
    }

    const result = await toggleBlocked(
      device.id,
      pending.kind !== "unblock",
      pending.kind === "block-self",
    );
    if (typeof result === "object") {
      setPending({ kind: "block-self", device, message: result.confirm });
    }
  }

  const pendingName = pending ? getDeviceDisplayName(pending.device) : "";

  return (
    <main className="space-y-4 p-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-cyan-500">
          <Router className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Network Devices</h1>
          <p className="text-muted-foreground text-sm">
            {devices.length > 0
              ? `${onlineCount} online of ${devices.length} known devices`
              : "Scan, detect new devices, and manage inventory fields."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Controls</CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <Input
                placeholder="Optional subnet filter (e.g. 192.168.86.0/24)"
                value={subnet}
                onChange={(event) => setSubnet(event.target.value)}
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setSearch("");
                  void loadDevices();
                }}
                disabled={loading || actionLoading}
              >
                <Search className="size-4" />
                Refresh
              </Button>
              <Button
                className="gap-2"
                onClick={() => void scanDevices(subnet || undefined)}
                disabled={actionLoading}
              >
                <Wifi className="size-4" />
                Scan Devices
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Lock className="size-4" />
              Read-only. Ask an admin to scan, rename or block devices.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Device Inventory</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-infrastructure"
                  checked={showInfrastructure}
                  onCheckedChange={setShowInfrastructure}
                />
                <Label htmlFor="show-infrastructure" className="text-sm">
                  Router &amp; gateways ({infrastructureCount})
                </Label>
              </div>
              <Input
                type="search"
                className="sm:w-72"
                placeholder="Search name, IP, MAC, vendor"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">
              Loading devices...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border py-8 text-center">
              No devices found.
            </p>
          ) : (
            <>
              {/* Phones: one card per device */}
              <ul className="divide-border -mx-2 divide-y md:hidden">
                {filtered.map((device) => (
                  <li
                    key={device.id}
                    className={`px-2 py-3 ${device.isOnline ? "" : "opacity-70"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <OnlineDot isOnline={device.isOnline} />
                          <DeviceLink device={device} />
                        </div>
                        <p className="text-muted-foreground truncate pl-4 text-xs">
                          <span className="font-mono">{device.ipAddress}</span>
                          {device.deviceType && ` · ${device.deviceType}`}
                          {device.vendor && ` · ${device.vendor}`}
                        </p>
                        <div className="pl-4">
                          <DeviceBadges device={device} />
                        </div>
                        <p className="text-muted-foreground pl-4 text-xs">
                          {lastSeenLabel(device)}
                          {usageToday[device.id]
                            ? ` · ${formatBytes(usageToday[device.id])} today`
                            : ""}
                        </p>
                      </div>
                      {canManage && (
                        <DeviceActions
                          device={device}
                          disabled={actionLoading}
                          onEdit={openEdit}
                          onReview={(id) => void markReviewed(id)}
                          onPending={setPending}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* iPad and up: table; secondary columns fold into the
                  device cell until there is room (xl). */}
              <div className="hidden overflow-x-auto rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead className="hidden 2xl:table-cell">MAC</TableHead>
                      <TableHead className="hidden xl:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Interface</TableHead>
                      <TableHead
                        className="hidden text-right xl:table-cell"
                        title="Estimated, since local midnight"
                      >
                        Today
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">Last seen</TableHead>
                      {canManage && (
                        <TableHead className="text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((device) => (
                      <TableRow
                        key={device.id}
                        className={device.isOnline ? undefined : "opacity-70"}
                      >
                        <TableCell className="max-w-56 lg:max-w-64">
                          <div className="flex items-center gap-2">
                            <OnlineDot isOnline={device.isOnline} />
                            <DeviceLink device={device} />
                          </div>
                          <div className="text-muted-foreground truncate pl-4 text-xs">
                            {[
                              device.name || device.dhcpHostname
                                ? device.vendor
                                : null,
                              device.deviceType,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                          <div className="text-muted-foreground pl-4 font-mono text-[11px] 2xl:hidden">
                            {device.macAddress}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-mono">{device.ipAddress}</div>
                          <div className="text-muted-foreground whitespace-nowrap xl:hidden">
                            {device.isOnline
                              ? "Online now"
                              : format(new Date(device.lastSeenAt), "MMM d, HH:mm")}
                            {usageToday[device.id]
                              ? ` · ${formatBytes(usageToday[device.id])}`
                              : ""}
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs 2xl:table-cell">
                          {device.macAddress}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {device.deviceType || "-"}
                        </TableCell>
                        <TableCell className="max-w-56 whitespace-normal">
                          <DeviceBadges device={device} />
                        </TableCell>
                        <TableCell className="hidden max-w-28 whitespace-normal xl:table-cell">
                          {device.intfDescription || "-"}
                        </TableCell>
                        <TableCell className="hidden text-right text-xs whitespace-nowrap xl:table-cell">
                          {usageToday[device.id]
                            ? formatBytes(usageToday[device.id])
                            : "-"}
                        </TableCell>
                        <TableCell className="hidden text-xs whitespace-nowrap xl:table-cell">
                          <div>{lastSeenLabel(device)}</div>
                          <div className="text-muted-foreground">
                            first {format(new Date(device.firstSeenAt), "MMM d")}
                          </div>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <DeviceActions
                              device={device}
                              disabled={actionLoading}
                              onEdit={openEdit}
                              onReview={(id) => void markReviewed(id)}
                              onPending={setPending}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "delete"
                ? `Remove ${pendingName}?`
                : pending?.kind === "unblock"
                  ? `Unblock ${pendingName}?`
                  : `Block ${pendingName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "delete" &&
                "Removes the device and its IP history from Home Hub. It is added back as a new device if the router still sees it."}
              {pending?.kind === "block" &&
                (pending.device.access
                  ? `Blocks ${pending.device.macAddress} on every address it uses (IPv4 and IPv6) and drops its open connections, until you unblock it.`
                  : `Adds ${pending.device.ipAddress} to the router's Blocked_Devices alias. The device loses network access through the firewall until you unblock it.`)}
              {pending?.kind === "unblock" &&
                (pending.device.access
                  ? "Removes the manual block. A pause, schedule or quarantine may still apply."
                  : `Removes ${pending.device.ipAddress} from the router's Blocked_Devices alias.`)}
              {pending?.kind === "block-self" && pending.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                pending?.kind === "unblock"
                  ? undefined
                  : "bg-destructive text-white hover:bg-destructive/90"
              }
              onClick={() => void runPendingAction()}
            >
              {pending?.kind === "delete"
                ? "Remove"
                : pending?.kind === "unblock"
                  ? "Unblock"
                  : pending?.kind === "block-self"
                    ? "Block anyway"
                    : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              {editDevice
                ? `${editDevice.macAddress} · ${editDevice.ipAddress}${editDevice.dhcpHostname ? ` · DHCP name "${editDevice.dhcpHostname}"` : ""}`
                : "Update the label and classification for this device."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["name", "Name", "Shown everywhere instead of the DHCP name"],
                ["deviceType", "Device Type", "e.g. Phone, TV, Laptop, Camera"],
                ["hostname", "Hostname", undefined],
                ["vendor", "Vendor", undefined],
              ] as const
            ).map(([field, label, hint]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  value={editState[field]}
                  onChange={(event) =>
                    setEditState((previous) => ({
                      ...previous,
                      [field]: event.target.value,
                    }))
                  }
                />
                {hint && (
                  <p className="text-muted-foreground text-xs">{hint}</p>
                )}
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={editState.notes}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={actionLoading}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function lastSeenLabel(device: NetworkDevice) {
  return device.isOnline
    ? "Online now"
    : `Seen ${format(new Date(device.lastSeenAt), "MMM d, HH:mm")}`;
}

function DeviceLink({ device }: { device: NetworkDevice }) {
  return (
    <Link
      href={`/network/devices/${device.id}`}
      className={`truncate font-medium hover:underline ${hasRealDeviceName(device) ? "" : "text-muted-foreground italic"}`}
    >
      {getDeviceDisplayName(device)}
    </Link>
  );
}

/** Block/unblock stays one tap away; the rest lives in the "⋯" menu. */
function DeviceActions({
  device,
  disabled,
  onEdit,
  onReview,
  onPending,
}: {
  device: NetworkDevice;
  disabled: boolean;
  onEdit: (device: NetworkDevice) => void;
  onReview: (id: string) => void;
  onPending: (action: PendingAction) => void;
}) {
  const disabledReason = blockDisabledReason(device);
  // In MAC mode only a manual block is undone here; pauses, schedules and
  // quarantine are managed elsewhere.
  const manuallyBlocked = device.access
    ? device.access.reasons.some((r) => r.kind === "manual")
    : device.isBlocked;

  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <span title={disabledReason ?? undefined}>
        <Button
          size="sm"
          className="h-9 min-w-20"
          variant={manuallyBlocked ? "secondary" : "destructive"}
          onClick={() =>
            onPending({ kind: manuallyBlocked ? "unblock" : "block", device })
          }
          disabled={disabled || (!manuallyBlocked && !!disabledReason)}
        >
          {manuallyBlocked ? "Unblock" : "Block"}
        </Button>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="size-9"
            aria-label={`More actions for ${getDeviceDisplayName(device)}`}
            disabled={disabled}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {device.isNew && (
            <DropdownMenuItem onSelect={() => onReview(device.id)}>
              <Check className="size-4" />
              Mark reviewed
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => onEdit(device)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => onPending({ kind: "delete", device })}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
