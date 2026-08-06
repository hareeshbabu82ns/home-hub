"use client";

import { format } from "date-fns";
import {
  Ban,
  CheckCircle2,
  Pencil,
  Router,
  Search,
  ShieldAlert,
  Trash2,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { NetworkDevice } from "@/types/network";

const defaultEditState = {
  id: "",
  name: "",
  hostname: "",
  macAddress: "",
  vendor: "",
  deviceType: "",
  intf: "",
  intfDescription: "",
  notes: "",
  isNew: false,
};

export default function NetworkDevicesPage() {
  const {
    devices,
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
  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState(defaultEditState);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const filtered = useMemo(() => {
    if (!search.trim()) return devices;
    const query = search.toLowerCase();
    return devices.filter((device) => {
      const haystack = [
        device.name,
        device.hostname,
        device.ipAddress,
        device.macAddress,
        device.vendor,
        device.deviceType,
        device.intf,
        device.intfDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [devices, search]);

  function openEdit(device: NetworkDevice) {
    setEditState({
      id: device.id,
      name: device.name || "",
      hostname: device.hostname || "",
      macAddress: device.macAddress || "",
      vendor: device.vendor || "",
      deviceType: device.deviceType || "",
      intf: device.intf || "",
      intfDescription: device.intfDescription || "",
      notes: device.notes || "",
      isNew: device.isNew,
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    const success = await saveDevice({
      ...editState,
      name: editState.name || undefined,
      hostname: editState.hostname || undefined,
      macAddress: editState.macAddress || undefined,
      vendor: editState.vendor || undefined,
      deviceType: editState.deviceType || undefined,
      intf: editState.intf || undefined,
      intfDescription: editState.intfDescription || undefined,
      notes: editState.notes || undefined,
    });

    if (success) {
      setEditOpen(false);
      setEditState(defaultEditState);
    }
  }

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-cyan-500">
          <Router className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Network Devices</h1>
          <p className="text-muted-foreground text-sm">
            Scan, detect new devices, and manage inventory fields.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder="Optional subnet override (e.g. 192.168.86.0/24)"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Device Inventory</CardTitle>
            <Input
              className="max-w-sm"
              placeholder="Search by IP, host, MAC, vendor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">
              Loading devices...
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Interface Description</TableHead>
                    <TableHead>Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-muted-foreground py-8 text-center"
                      >
                        No devices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="font-medium">
                            {device.name || device.hostname || "Unknown"}
                          </div>
                          {device.vendor && (
                            <div className="text-muted-foreground text-xs">
                              {device.vendor}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {device.ipAddress}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {device.macAddress ? (
                            <Link
                              href={`/network/devices/${device.id}`}
                              className="text-primary hover:underline"
                            >
                              {device.macAddress}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{device.deviceType || "-"}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{device.intfDescription || "-"}</TableCell>
                        <TableCell>
                          {device.isNew && (
                            <Badge variant="destructive" className="gap-1">
                              <ShieldAlert className="size-3" />
                              New
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            {format(
                              new Date(device.lastSeenAt),
                              "MMM d, HH:mm",
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            first{" "}
                            {format(new Date(device.firstSeenAt), "MMM d")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {device.isNew && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void markReviewed(device.id)}
                                disabled={actionLoading}
                              >
                                Review
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(device)}
                              disabled={actionLoading}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => void removeDevice(device.id)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                device.isBlocked ? "secondary" : "destructive"
                              }
                              onClick={() =>
                                void toggleBlocked(device.id, !device.isBlocked)
                              }
                              disabled={actionLoading}
                            >
                              {device.isBlocked ? "Unblock" : "Block"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update details and classification fields for this device.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editState.name}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                value={editState.hostname}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    hostname: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                value={editState.macAddress}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    macAddress: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={editState.vendor}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    vendor: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type</Label>
              <Input
                id="deviceType"
                value={editState.deviceType}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    deviceType: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intf">Interface</Label>
              <Input
                id="intf"
                value={editState.intf}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    intf: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="intfDescription">Interface Description</Label>
              <Input
                id="intfDescription"
                value={editState.intfDescription}
                onChange={(event) =>
                  setEditState((previous) => ({
                    ...previous,
                    intfDescription: event.target.value,
                  }))
                }
              />
            </div>
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
