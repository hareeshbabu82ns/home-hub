"use client";

import { Gauge, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setDeviceQuota } from "@/lib/actions/network-control";

/** Daily data quota (estimated, local day) with alert-only or block action. */
export function DeviceQuotaControl({
  deviceId,
  dailyQuotaMB,
  quotaAction,
  macMode,
  onChanged,
}: {
  deviceId: string;
  dailyQuotaMB: number | null | undefined;
  quotaAction: string | null | undefined;
  macMode: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [quota, setQuota] = useState(dailyQuotaMB ? String(dailyQuotaMB) : "");
  const [action, setAction] = useState<"alert" | "block">(quotaAction === "block" ? "block" : "alert");
  const [busy, setBusy] = useState(false);

  async function save(clear = false) {
    const value = clear ? null : Number(quota);
    if (!clear && (!Number.isInteger(value) || (value ?? 0) < 1)) {
      toast.error("Enter a whole number of MB");
      return;
    }
    setBusy(true);
    const result = await setDeviceQuota({ id: deviceId, dailyQuotaMB: value, quotaAction: action });
    setBusy(false);
    if (result.success) {
      toast.success(clear ? "Quota removed" : `Daily quota set to ${value} MB`);
      if (clear) setQuota("");
      await onChanged();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Gauge className="size-4" />
        Daily data quota
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="quota-mb" className="text-xs">
            MB per day
          </Label>
          <Input
            id="quota-mb"
            inputMode="numeric"
            className="w-28"
            placeholder="e.g. 2000"
            value={quota}
            onChange={(event) => setQuota(event.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">When reached</Label>
          <Select value={action} onValueChange={(value) => setAction(value as "alert" | "block")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alert">Alert only</SelectItem>
              <SelectItem value="block" disabled={!macMode}>
                Block until midnight{macMode ? "" : " (needs MAC control)"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" disabled={busy || !quota} onClick={() => void save()}>
          {busy && <Loader2 className="mr-1 size-4 animate-spin" />}
          Save
        </Button>
        {dailyQuotaMB ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void save(true)}>
            Remove
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        Usage is estimated from sampled traffic, so treat the quota as approximate.
      </p>
    </div>
  );
}
