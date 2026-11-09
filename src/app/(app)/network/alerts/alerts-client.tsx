"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { CheckCheck, Loader2, Mail } from "lucide-react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  getAlertSettings,
  getNetworkAlerts,
  markAlertsRead,
  saveAlertSettings,
  sendTestAlertEmail,
} from "@/lib/actions/network-monitoring";

type AlertsData = Extract<Awaited<ReturnType<typeof getNetworkAlerts>>, { success: true }>["data"];
type SettingsData = Extract<Awaited<ReturnType<typeof getAlertSettings>>, { success: true }>["data"];

const SEVERITY_STYLE = {
  critical: "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
  warning: "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
  info: "",
} as const;

export function AlertsClient() {
  const [showResolved, setShowResolved] = useState(false);
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const loadAlerts = useCallback(async (includeResolved: boolean) => {
    const result = await getNetworkAlerts({ includeResolved });
    if (result.success) setAlerts(result.data);
    else setError(result.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getNetworkAlerts({ includeResolved: showResolved }).then((result) => {
      if (cancelled) return;
      if (result.success) setAlerts(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [showResolved]);

  useEffect(() => {
    void getAlertSettings().then((result) => {
      if (result.success) setSettings(result.data);
    });
  }, []);

  async function markAll() {
    const result = await markAlertsRead();
    if (result.success) await loadAlerts(showResolved);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    const result = await saveAlertSettings({
      alertEmailEnabled: settings.alertEmailEnabled,
      alertEmail: settings.alertEmail,
      alertMinSeverity: settings.alertMinSeverity,
    });
    setSaving(false);
    if (result.success) toast.success("Alert settings saved");
    else toast.error(result.error);
  }

  async function sendTest() {
    setTestOpen(false);
    const result = await sendTestAlertEmail();
    if (result.success) toast.success(`Test email sent to ${result.to}`);
    else toast.error(result.error);
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;

  const unread = alerts?.alerts.filter((a) => !a.read && !a.resolvedAt).length ?? 0;
  const testRecipient = settings?.alertEmail || settings?.accountEmail;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            {showResolved ? "All alerts" : "Open alerts"}
            {unread > 0 && <Badge variant="destructive">{unread} unread</Badge>}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="show-resolved" checked={showResolved} onCheckedChange={setShowResolved} />
              <Label htmlFor="show-resolved" className="text-sm">
                Include resolved
              </Label>
            </div>
            <Button size="sm" variant="outline" onClick={() => void markAll()} disabled={unread === 0}>
              <CheckCheck className="mr-1 size-4" />
              Mark all read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {!alerts ? (
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          ) : alerts.alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {showResolved ? "No alerts recorded yet." : "All clear: no open alerts."}
            </p>
          ) : (
            alerts.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-3 ${alert.resolvedAt ? "opacity-60" : SEVERITY_STYLE[alert.severity]}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`font-medium ${alert.read ? "" : "font-semibold"}`}>
                    {alert.deviceId ? (
                      <Link href={`/network/devices/${alert.deviceId}`} className="hover:underline">
                        {alert.title}
                      </Link>
                    ) : (
                      alert.title
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === "critical" ? "destructive" : "outline"}>
                      {alert.severity}
                    </Badge>
                    {alert.emailed && <Mail className="text-muted-foreground size-3.5" aria-label="Emailed" />}
                  </div>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{alert.message}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDistanceToNowStrict(new Date(alert.createdAt), { addSuffix: true })}
                  {alert.resolvedAt &&
                    ` · resolved ${formatDistanceToNowStrict(new Date(alert.resolvedAt), { addSuffix: true })}`}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email notifications</CardTitle>
          <CardDescription>
            {settings && !settings.emailConfigured
              ? "Email isn't configured on the server (RESEND_API_KEY)."
              : "Each alert is emailed once when it opens (at most 10 per hour)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings ? (
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="alert-email-enabled">Send alert emails</Label>
                <Switch
                  id="alert-email-enabled"
                  disabled={!settings.canManage || !settings.emailConfigured}
                  checked={settings.alertEmailEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, alertEmailEnabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-email">Send to</Label>
                <Input
                  id="alert-email"
                  type="email"
                  disabled={!settings.canManage}
                  placeholder={settings.accountEmail ?? "you@example.com"}
                  value={settings.alertEmail}
                  onChange={(event) => setSettings({ ...settings, alertEmail: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum severity</Label>
                <Select
                  disabled={!settings.canManage}
                  value={settings.alertMinSeverity}
                  onValueChange={(value) =>
                    setSettings({ ...settings, alertMinSeverity: value as SettingsData["alertMinSeverity"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (includes new devices)</SelectItem>
                    <SelectItem value="warning">Warning and critical</SelectItem>
                    <SelectItem value="critical">Critical only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.canManage && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void save()} disabled={saving}>
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!settings.emailConfigured || !testRecipient}
                    onClick={() => setTestOpen(true)}
                  >
                    Send test email
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={testOpen} onOpenChange={setTestOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send a test email?</AlertDialogTitle>
            <AlertDialogDescription>
              Sends one email to {testRecipient} through Resend. Save first if you changed the address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void sendTest()}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
