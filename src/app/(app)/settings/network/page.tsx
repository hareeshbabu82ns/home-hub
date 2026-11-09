"use client";

import { Loader2, Router } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getNetworkSettings, saveNetworkSettings } from "@/lib/actions/network";

import { NetworkTransferCard } from "@/components/network/network-transfer-card";

import { RouterControlCard } from "./router-control-card";

function toRouterHostInput(apiBaseUrl: string): string {
  try {
    const parsed = new URL(apiBaseUrl);
    return parsed.host;
  } catch {
    return apiBaseUrl;
  }
}

function toApiBaseUrl(routerHost: string): string {
  const value = routerHost.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export default function NetworkSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  // Saved credentials are never sent to the browser; blank inputs keep them.
  const [saved, setSaved] = useState<{
    apiKeyHint: string | null;
    hasApiKey: boolean;
    hasApiSecret: boolean;
  } | null>(null);
  const [form, setForm] = useState({
    routerHostIp: "192.168.86.1",
    apiKey: "",
    apiSecret: "",
    defaultSubnet: "",
    verifyTls: false,
  });

  useEffect(() => {
    async function load() {
      const result = await getNetworkSettings();
      if (result.success) {
        setCanManage(!!result.canManage);
      }
      if (result.success && result.settings) {
        setForm({
          routerHostIp: toRouterHostInput(result.settings.apiBaseUrl),
          apiKey: "",
          apiSecret: "",
          defaultSubnet: result.settings.defaultSubnet || "",
          verifyTls: result.settings.verifyTls,
        });
        setSaved(result.settings);
      }

      if (!result.success) {
        toast.error(result.error || "Failed to load settings");
      }

      setLoading(false);
    }

    void load();
  }, []);

  async function onSave() {
    setSaving(true);

    const result = await saveNetworkSettings({
      apiBaseUrl: toApiBaseUrl(form.routerHostIp),
      apiKey: form.apiKey || undefined,
      apiSecret: form.apiSecret || undefined,
      defaultSubnet: form.defaultSubnet || undefined,
      verifyTls: form.verifyTls,
    });

    setSaving(false);

    if (result.success && result.settings) {
      toast.success("Network settings saved");
      setSaved(result.settings);
      setForm((previous) => ({ ...previous, apiKey: "", apiSecret: "" }));
      return;
    }

    toast.error(result.error || "Failed to save settings");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="size-5" />
            Network API Settings
          </CardTitle>
          <CardDescription>
            Configure router API credentials used for device discovery.
            {!canManage && " Only admins can change these settings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routerHostIp">Router Host IP</Label>
            <Input
              id="routerHostIp"
              disabled={!canManage}
              placeholder="192.168.86.1"
              value={form.routerHostIp}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  routerHostIp: event.target.value,
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              The app will call{" "}
              <span className="font-mono">
                https://HOST_IP/api/diagnostics/interface/search_arp
              </span>
              .
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              autoComplete="off"
              disabled={!canManage}
              placeholder={
                saved?.hasApiKey
                  ? `Saved${saved.apiKeyHint ? ` (ends in ${saved.apiKeyHint})` : ""}. Leave blank to keep`
                  : "OPNsense API key"
              }
              value={form.apiKey}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  apiKey: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              autoComplete="new-password"
              disabled={!canManage}
              placeholder={
                saved?.hasApiSecret
                  ? "Saved (encrypted). Leave blank to keep"
                  : "OPNsense API secret"
              }
              value={form.apiSecret}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  apiSecret: event.target.value,
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              Stored encrypted on the server and never sent back to the
              browser.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultSubnet">Default Subnet (optional)</Label>
            <Input
              id="defaultSubnet"
              disabled={!canManage}
              placeholder="192.168.86.0/24"
              value={form.defaultSubnet}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  defaultSubnet: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Verify TLS certificate</p>
              <p className="text-muted-foreground text-xs">
                Disable for self-signed local router certificates.
              </p>
            </div>
            <Switch
              disabled={!canManage}
              checked={form.verifyTls}
              onCheckedChange={(checked) =>
                setForm((previous) => ({ ...previous, verifyTls: checked }))
              }
            />
          </div>

          <Button onClick={() => void onSave()} disabled={saving || !canManage}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardContent>
      </Card>

      {saved && <RouterControlCard />}

      <NetworkTransferCard canManage={canManage} />
    </div>
  );
}
