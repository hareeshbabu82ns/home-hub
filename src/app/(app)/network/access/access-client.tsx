"use client";

import { format } from "date-fns";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAccessSchedule,
  getNetworkAuditLog,
  listAccessSchedules,
  saveAccessSchedule,
} from "@/lib/actions/network-control";
import { formatMinute } from "@/lib/network/access-policy";

type ScheduleData = Extract<Awaited<ReturnType<typeof listAccessSchedules>>, { success: true }>["data"];
type Schedule = ScheduleData["schedules"][number];
type AuditEntry = Extract<Awaited<ReturnType<typeof getNetworkAuditLog>>, { success: true }>["data"][number];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Form {
  id?: string;
  name: string;
  enabled: boolean;
  days: number[];
  start: string;
  end: string;
  deviceIds: string[];
}

const EMPTY_FORM: Form = {
  name: "Bedtime",
  enabled: true,
  days: [0, 1, 2, 3, 4],
  start: "22:00",
  end: "07:00",
  deviceIds: [],
};

function toMinute(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function describeDays(days: number[]) {
  const sorted = [...days].sort();
  if (sorted.length === 7) return "Every day";
  if (sorted.join() === "1,2,3,4,5") return "Weekdays";
  if (sorted.join() === "0,6") return "Weekends";
  return sorted.map((day) => DAY_LABELS[day]).join(", ");
}

export function AccessClient() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [deviceFilter, setDeviceFilter] = useState("");
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [schedules, log] = await Promise.all([listAccessSchedules(), getNetworkAuditLog({ limit: 100 })]);
    if (schedules.success) setData(schedules.data);
    else setError(schedules.error);
    if (log.success) setAudit(log.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listAccessSchedules(), getNetworkAuditLog({ limit: 100 })]).then(([schedules, log]) => {
      if (cancelled) return;
      if (schedules.success) setData(schedules.data);
      else setError(schedules.error);
      if (log.success) setAudit(log.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const deviceName = useMemo(
    () => new Map((data?.devices ?? []).map((device) => [device.id, device.name])),
    [data],
  );

  const visibleDevices = useMemo(() => {
    const query = deviceFilter.trim().toLowerCase();
    return (data?.devices ?? []).filter(
      (device) => !query || `${device.name} ${device.ipAddress}`.toLowerCase().includes(query),
    );
  }, [data, deviceFilter]);

  async function save() {
    if (!form) return;
    setBusy(true);
    const result = await saveAccessSchedule({
      id: form.id,
      name: form.name,
      enabled: form.enabled,
      days: form.days,
      startMinute: toMinute(form.start),
      endMinute: toMinute(form.end),
      deviceIds: form.deviceIds,
    });
    setBusy(false);
    if (result.success) {
      toast.success(`Schedule "${form.name}" saved`);
      setForm(null);
      await load();
    } else {
      toast.error(result.error);
    }
  }

  async function remove(schedule: Schedule) {
    setDeleting(null);
    setBusy(true);
    const result = await deleteAccessSchedule(schedule.id);
    setBusy(false);
    if (result.success) {
      toast.success(`Schedule "${schedule.name}" deleted`);
      await load();
    } else {
      toast.error(result.error);
    }
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const canEdit = data.canManage && data.mode === "mac";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5" />
              Schedules
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Devices have no network access during these windows (times in {data.timeZone}).
            </p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => setForm({ ...EMPTY_FORM })}>
              <Plus className="mr-1 size-4" />
              New schedule
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {data.mode !== "mac" && (
            <p className="text-muted-foreground text-sm">
              Schedules need MAC control.{" "}
              <Link href="/settings/network" className="text-primary hover:underline">
                Prepare the router
              </Link>{" "}
              first.
            </p>
          )}
          {data.schedules.length === 0 ? (
            data.mode === "mac" && <p className="text-muted-foreground text-sm">No schedules yet.</p>
          ) : (
            data.schedules.map((schedule) => (
              <div key={schedule.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {schedule.name}
                    {!schedule.enabled && <Badge variant="outline">Off</Badge>}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {describeDays(schedule.days)} · {formatMinute(schedule.startMinute)}–{formatMinute(schedule.endMinute)}
                    {schedule.endMinute < schedule.startMinute ? " (next day)" : ""}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {schedule.deviceIds.map((id) => deviceName.get(id) ?? "removed device").join(", ")}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Edit schedule"
                      onClick={() =>
                        setForm({
                          id: schedule.id,
                          name: schedule.name,
                          enabled: schedule.enabled,
                          days: schedule.days,
                          start: formatMinute(schedule.startMinute),
                          end: formatMinute(schedule.endMinute),
                          deviceIds: schedule.deviceIds,
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" aria-label="Delete schedule" onClick={() => setDeleting(schedule)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <p className="text-muted-foreground text-xs">
            Every change made through Home Hub, and what the enforcer applied on the router.
          </p>
        </CardHeader>
        <CardContent>
          <AuditLog entries={audit} />
        </CardContent>
      </Card>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit schedule" : "New schedule"}</DialogTitle>
            <DialogDescription>
              Selected devices lose network access in this window. A window that ends earlier than
              it starts runs past midnight.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="schedule-name">Name</Label>
                  <Input id="schedule-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch id="schedule-enabled" checked={form.enabled} onCheckedChange={(enabled) => setForm({ ...form, enabled })} />
                  <Label htmlFor="schedule-enabled">Enabled</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Days the window starts</Label>
                <div className="flex flex-wrap gap-1">
                  {DAY_LABELS.map((label, day) => {
                    const on = form.days.includes(day);
                    return (
                      <Button
                        key={label}
                        type="button"
                        size="sm"
                        variant={on ? "default" : "outline"}
                        aria-pressed={on}
                        onClick={() =>
                          setForm({ ...form, days: on ? form.days.filter((d) => d !== day) : [...form.days, day] })
                        }
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-start">From</Label>
                  <Input id="schedule-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-end">Until</Label>
                  <Input id="schedule-end" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Devices ({form.deviceIds.length} selected)</Label>
                <Input placeholder="Filter devices" value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)} />
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                  {visibleDevices.map((device) => {
                    const checked = form.deviceIds.includes(device.id);
                    return (
                      <label key={device.id} className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setForm({
                              ...form,
                              deviceIds: value ? [...form.deviceIds, device.id] : form.deviceIds.filter((id) => id !== device.id),
                            })
                          }
                        />
                        <span className="truncate">{device.name}</span>
                        <span className="text-muted-foreground ml-auto font-mono text-xs">{device.ipAddress}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>Devices blocked only by this schedule get access back right away.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => deleting && void remove(deleting)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const AUDIT_PAGE = 25;

/**
 * Phones: stacked entries. iPad and up: a table whose secondary column
 * (who) folds under the time until there's room. Long errors wrap.
 */
function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const [visible, setVisible] = useState(AUDIT_PAGE);
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">Nothing recorded yet.</p>;
  }
  const shown = entries.slice(0, visible);

  const target = (entry: AuditEntry) =>
    entry.deviceId ? (
      <Link href={`/network/devices/${entry.deviceId}`} className="hover:underline">
        {entry.target ?? "device"}
      </Link>
    ) : (
      (entry.target ?? "-")
    );

  return (
    <div className="space-y-3">
      <ul className="divide-border -mx-2 divide-y md:hidden">
        {shown.map((entry) => (
          <li key={entry.id} className="space-y-1 px-2 py-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm">{entry.action}</span>
              {entry.success ? (
                <Badge variant="secondary">ok</Badge>
              ) : (
                <Badge variant="destructive">failed</Badge>
              )}
            </div>
            {entry.target && <div className="break-words">{target(entry)}</div>}
            {!entry.success && entry.error && (
              <div className="text-destructive break-words">{entry.error}</div>
            )}
            <div className="text-muted-foreground">
              {format(new Date(entry.at), "MMM d, HH:mm:ss")} · {entry.actor}
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead className="hidden lg:table-cell">Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(entry.at), "MMM d, HH:mm:ss")}
                  <div className="text-muted-foreground max-w-40 truncate lg:hidden">{entry.actor}</div>
                </TableCell>
                <TableCell className="hidden text-xs lg:table-cell">{entry.actor}</TableCell>
                <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                <TableCell className="max-w-60 text-xs break-words whitespace-normal">{target(entry)}</TableCell>
                <TableCell className="max-w-72 text-xs break-words whitespace-normal">
                  {entry.success ? (
                    <Badge variant="secondary">ok</Badge>
                  ) : (
                    <span className="text-destructive">{entry.error}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {entries.length > visible && (
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setVisible(visible + AUDIT_PAGE)}>
          Show more ({entries.length - visible} older)
        </Button>
      )}
    </div>
  );
}
