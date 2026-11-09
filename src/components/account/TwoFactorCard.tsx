"use client";

import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  beginMfaSetup,
  cancelMfaSetup,
  confirmMfaSetup,
  disableMyMfa,
  getMyMfaStatus,
  regenerateMyRecoveryCodes,
} from "@/lib/actions/mfa";

type Status = {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
};
type Setup = { secret: string; uri: string; qrDataUrl: string };
type CodePrompt = "disable" | "regenerate" | null;

/** Authenticator-app (TOTP) two-factor authentication: setup and management. */
export function TwoFactorCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [prompt, setPrompt] = useState<CodePrompt>(null);
  const [promptCode, setPromptCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await getMyMfaStatus();
    if (result.success) setStatus(result.data);
    else toast.error(result.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getMyMfaStatus().then((result) => {
      if (cancelled) return;
      if (result.success) setStatus(result.data);
      else toast.error(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function start() {
    setBusy(true);
    const result = await beginMfaSetup();
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    setSetup(result.data);
    setSetupCode("");
  }

  async function confirm() {
    setBusy(true);
    const result = await confirmMfaSetup(setupCode);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    setSetup(null);
    setRecoveryCodes(result.recoveryCodes);
    toast.success("Two-factor authentication is on");
    await load();
  }

  async function cancel() {
    setSetup(null);
    await cancelMfaSetup();
  }

  async function submitPrompt() {
    setBusy(true);
    if (prompt === "disable") {
      const result = await disableMyMfa(promptCode);
      setBusy(false);
      if (!result.success) return toast.error(result.error);
      toast.success("Two-factor authentication is off");
    } else {
      const result = await regenerateMyRecoveryCodes(promptCode);
      setBusy(false);
      if (!result.success) return toast.error(result.error);
      setRecoveryCodes(result.recoveryCodes);
    }
    setPrompt(null);
    setPromptCode("");
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Two-factor authentication
          {status?.enabled && (
            <Badge className="ml-auto gap-1">
              <ShieldCheck className="size-3" /> On
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          After your password (or Google/GitHub), also ask for a code from an
          authenticator app such as iOS Passwords, Google Authenticator,
          1Password or Authy.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!status ? (
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        ) : setup ? (
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
              <img
                src={setup.qrDataUrl}
                alt="QR code for your authenticator app"
                className="size-48 rounded-lg bg-white p-2"
              />
              <a
                href={setup.uri}
                className="text-primary text-sm hover:underline md:hidden"
              >
                Open in authenticator app
              </a>
            </div>
            <div className="space-y-4">
              <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
                <li>
                  Scan the QR code with your authenticator app (on a phone, tap
                  the link instead).
                </li>
                <li>Or enter this key by hand:</li>
              </ol>
              <code className="bg-muted block rounded-md px-3 py-2 font-mono text-sm break-all select-all">
                {setup.secret}
              </code>
              <div className="space-y-2">
                <Label htmlFor="mfa-setup-code">
                  Enter the 6-digit code it shows
                </Label>
                <Input
                  id="mfa-setup-code"
                  value={setupCode}
                  onChange={(event) =>
                    setSetupCode(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="h-11 max-w-40 font-mono tracking-widest"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && setupCode.length === 6)
                      void confirm();
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void confirm()}
                  disabled={busy || setupCode.length !== 6}
                >
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Turn on
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void cancel()}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : status.enabled ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p>
                On since{" "}
                {status.enabledAt
                  ? new Date(status.enabledAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })
                  : "—"}
              </p>
              <p
                className={
                  status.recoveryCodesLeft <= 2
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {status.recoveryCodesLeft} recovery code
                {status.recoveryCodesLeft === 1 ? "" : "s"} left
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt("regenerate")}
              >
                <KeyRound className="mr-2 size-4" />
                New recovery codes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setPrompt("disable")}
              >
                Turn off
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => void start()} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Set up authenticator app
          </Button>
        )}
      </CardContent>

      {/* Code check before turning off / replacing recovery codes */}
      <Dialog
        open={prompt !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPrompt(null);
            setPromptCode("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {prompt === "disable"
                ? "Turn off two-factor authentication?"
                : "Create new recovery codes?"}
            </DialogTitle>
            <DialogDescription>
              {prompt === "disable"
                ? "Enter a code from your authenticator app (or a recovery code) to confirm."
                : "Your current recovery codes stop working. Enter a code from your authenticator app to confirm."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={promptCode}
            onChange={(event) => setPromptCode(event.target.value)}
            placeholder="123456"
            autoComplete="one-time-code"
            autoCapitalize="none"
            className="h-11 font-mono"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && promptCode.trim().length >= 6)
                void submitPrompt();
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPrompt(null)}>
              Cancel
            </Button>
            <Button
              variant={prompt === "disable" ? "destructive" : "default"}
              onClick={() => void submitPrompt()}
              disabled={busy || promptCode.trim().length < 6}
            >
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {prompt === "disable" ? "Turn off" : "Create codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecoveryCodesDialog
        codes={recoveryCodes}
        onClose={() => setRecoveryCodes(null)}
      />
    </Card>
  );
}

function RecoveryCodesDialog({
  codes,
  onClose,
}: {
  codes: string[] | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = codes?.join("\n") ?? "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy; select the codes and copy them by hand");
    }
  }

  function download() {
    const blob = new Blob(
      [`Home Hub recovery codes (each works once)\n\n${text}\n`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: "home-hub-recovery-codes.txt",
    });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={codes !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Save your recovery codes</DialogTitle>
          <DialogDescription>
            If you lose your phone, each code signs you in once. They won&apos;t
            be shown again; keep them in a password manager.
          </DialogDescription>
        </DialogHeader>
        <ul className="bg-muted grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg p-4 font-mono text-sm select-all">
          {codes?.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? (
                <Check className="mr-2 size-4" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download className="mr-2 size-4" />
              Download
            </Button>
          </div>
          <Button onClick={onClose}>I&apos;ve saved them</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
