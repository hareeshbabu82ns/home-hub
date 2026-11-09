"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileJson,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  applyNetworkImport,
  exportNetworkConfig,
  previewNetworkImport,
} from "@/lib/actions/network-transfer";
import type { ImportSummary } from "@/lib/network/config-transfer";

type Sections = {
  devices: boolean;
  schedules: boolean;
  siteRules: boolean;
  settings: boolean;
};

const SECTION_LABELS: Record<keyof Sections, string> = {
  devices: "Device names, types, notes, blocks and quotas",
  schedules: "Access schedules",
  siteRules: "Website rules",
  settings: "Quarantine, timezone and alert settings",
};

/**
 * Backup / restore of the network inventory and access settings as a JSON
 * file (matched by MAC address, no router credentials).
 */
export function NetworkTransferCard({ canManage }: { canManage: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [sections, setSections] = useState<Sections>({
    devices: true,
    schedules: true,
    siteRules: true,
    settings: true,
  });
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [createMissingDevices, setCreateMissingDevices] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const options = { sections, mode, createMissingDevices };

  async function onExport() {
    setExporting(true);
    const result = await exportNetworkConfig();
    setExporting(false);
    if (!result.success) return toast.error(result.error);

    const name = `home-hub-network-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([result.json], { type: "application/json" });
    const shareFile = new File([blob], name, { type: "application/json" });
    // Installed iOS apps can't trigger downloads; the share sheet saves to Files.
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone && navigator.canShare?.({ files: [shareFile] })) {
      try {
        await navigator.share({ files: [shareFile], title: name });
        return;
      } catch {
        // cancelled: fall through to a normal download
      }
    }
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: name,
    }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(
      `Exported ${result.counts.devices} devices, ${result.counts.schedules} schedules and ${result.counts.siteRules} website rules`,
    );
  }

  async function preview(nextFile = file, nextOptions = options) {
    if (!nextFile) return;
    setBusy(true);
    const result = await previewNetworkImport(nextFile.text, nextOptions);
    setBusy(false);
    if (!result.success) {
      setSummary(null);
      return toast.error(result.error);
    }
    setSummary(result.summary);
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    const next = { name: picked.name, text: await picked.text() };
    setFile(next);
    await preview(next);
  }

  function updateOptions(patch: Partial<typeof options>) {
    const next = { ...options, ...patch };
    if (patch.sections) setSections(patch.sections);
    if (patch.mode) setMode(patch.mode);
    if (patch.createMissingDevices !== undefined)
      setCreateMissingDevices(patch.createMissingDevices);
    void preview(file, next);
  }

  async function onApply(confirmSelf = false) {
    if (!file) return;
    setBusy(true);
    const result = await applyNetworkImport(file.text, options, confirmSelf);
    setBusy(false);
    if (!result.success) {
      if ("requiresConfirmation" in result && result.requiresConfirmation) {
        if (window.confirm(`${result.error}\n\nImport anyway?`))
          await onApply(true);
        return;
      }
      return toast.error(result.error);
    }
    toast.success("Import complete", { description: result.notice });
    setFile(null);
    setSummary(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Backup &amp; restore
        </CardTitle>
        <CardDescription>
          Export devices and access settings to a file, or import them into this
          (or another) Home Hub. Devices are matched by MAC address. Router
          credentials and history aren&apos;t included.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void onExport()}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="mr-2 size-4" />
            )}
            Export
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
              >
                <ArrowUpFromLine className="mr-2 size-4" />
                Import…
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => void onPick(event)}
              />
            </>
          )}
        </div>

        {file && (
          <div className="border-border space-y-5 rounded-lg border p-4">
            <p className="text-sm">
              <span className="text-muted-foreground">File:</span>{" "}
              <span className="font-medium break-all">{file.name}</span>
            </p>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Import</legend>
              {(Object.keys(SECTION_LABELS) as (keyof Sections)[]).map(
                (key) => (
                  <label
                    key={key}
                    className="flex min-h-9 items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={sections[key]}
                      onCheckedChange={(checked) =>
                        updateOptions({
                          sections: { ...sections, [key]: checked === true },
                        })
                      }
                    />
                    {SECTION_LABELS[key]}
                  </label>
                ),
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">
                Existing schedules and website rules
              </legend>
              <RadioGroup
                value={mode}
                onValueChange={(value) =>
                  updateOptions({ mode: value as "merge" | "replace" })
                }
              >
                <label className="flex min-h-9 items-center gap-3 text-sm">
                  <RadioGroupItem value="merge" /> Keep ones that aren&apos;t in
                  the file (merge)
                </label>
                <label className="flex min-h-9 items-center gap-3 text-sm">
                  <RadioGroupItem value="replace" /> Remove ones that
                  aren&apos;t in the file (replace)
                </label>
              </RadioGroup>
            </fieldset>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="create-missing" className="text-sm font-normal">
                Add devices this Home Hub hasn&apos;t seen yet
              </Label>
              <Switch
                id="create-missing"
                checked={createMissingDevices}
                onCheckedChange={(checked) =>
                  updateOptions({ createMissingDevices: checked })
                }
              />
            </div>

            {busy && !summary ? (
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            ) : summary ? (
              <ImportPreview summary={summary} />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void onApply()}
                disabled={busy || !summary?.hasChanges}
              >
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                Apply import
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  setSummary(null);
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImportPreview({ summary }: { summary: ImportSummary }) {
  const rows: [string, string[], number | null][] = [
    ["New devices", summary.devices.create, null],
    [
      "Updated devices",
      summary.devices.update.map((d) => `${d.label} (${d.fields.join(", ")})`),
      null,
    ],
    ["New schedules", summary.schedules.create, null],
    ["Updated schedules", summary.schedules.update, null],
    ["Removed schedules", summary.schedules.remove, null],
    ["Website rules added or changed", summary.siteRules.add, null],
    ["Website rules removed", summary.siteRules.remove, null],
    ["Settings changed", summary.settings, null],
  ];
  const unchanged =
    summary.devices.unchanged +
    summary.schedules.unchanged +
    summary.siteRules.unchanged;

  return (
    <div className="space-y-3">
      {summary.selfBlock.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            This blocks {summary.selfBlock.join(", ")}, which looks like the
            device you&apos;re using.
          </AlertDescription>
        </Alert>
      )}
      {summary.warnings.map((warning) => (
        <Alert key={warning}>
          <AlertTriangle className="size-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}
      {!summary.hasChanges ? (
        <p className="text-muted-foreground text-sm">
          Everything in this file already matches. Nothing to import.
        </p>
      ) : (
        <dl className="space-y-2 text-sm">
          {rows
            .filter(([, items]) => items.length > 0)
            .map(([label, items]) => (
              <div key={label}>
                <dt className="font-medium">
                  {label}{" "}
                  <span className="text-muted-foreground">
                    ({items.length})
                  </span>
                </dt>
                <dd className="text-muted-foreground line-clamp-3 break-words">
                  {items.join(" · ")}
                </dd>
              </div>
            ))}
          {unchanged > 0 && (
            <p className="text-muted-foreground">
              {unchanged} item(s) already match and stay as they are.
            </p>
          )}
        </dl>
      )}
    </div>
  );
}
