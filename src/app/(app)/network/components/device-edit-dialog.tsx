"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type { NetworkDevice } from "@/types/network";

export interface DeviceEditInput {
  id: string;
  name?: string;
  hostname?: string;
  vendor?: string;
  deviceType?: string;
  notes?: string;
}

const FIELDS = [
  ["name", "Name", "Shown everywhere instead of the DHCP name"],
  ["deviceType", "Device Type", "e.g. Phone, TV, Laptop, Camera"],
  ["hostname", "Hostname", undefined],
  ["vendor", "Vendor", undefined],
] as const;

type FormState = Record<"name" | "deviceType" | "hostname" | "vendor" | "notes", string>;

function initialState(device: NetworkDevice | null): FormState {
  return {
    name: device?.name ?? "",
    deviceType: device?.deviceType ?? "",
    hostname: device?.hostname ?? "",
    vendor: device?.vendor ?? "",
    notes: device?.notes ?? "",
  };
}

/**
 * Label and classify a device (inventory list and device details). Render it
 * with `key={device?.id}` so the form resets when another device is opened.
 */
export function DeviceEditDialog({
  device,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  device: NetworkDevice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves true when saved; the dialog then closes. */
  onSave: (input: DeviceEditInput) => Promise<boolean>;
  saving?: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(device));

  async function save() {
    if (!device) return;
    const saved = await onSave({
      id: device.id,
      name: form.name || undefined,
      hostname: form.hostname || undefined,
      vendor: form.vendor || undefined,
      deviceType: form.deviceType || undefined,
      notes: form.notes || undefined,
    });
    if (saved) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription className="break-words">
            {device
              ? `${device.macAddress} · ${device.ipAddress}${device.dhcpHostname ? ` · DHCP name "${device.dhcpHostname}"` : ""}`
              : "Update the label and classification for this device."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="device-edit-form"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {FIELDS.map(([field, label, hint]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`device-${field}`}>{label}</Label>
              <Input
                id={`device-${field}`}
                value={form[field]}
                autoComplete="off"
                onChange={(event) => setForm((previous) => ({ ...previous, [field]: event.target.value }))}
              />
              {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
            </div>
          ))}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="device-notes">Notes</Label>
            <Textarea
              id="device-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="device-edit-form" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
