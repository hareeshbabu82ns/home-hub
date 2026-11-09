"use client";

import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { cancelMfaSignIn, verifyMfaSignIn } from "@/lib/actions/mfa";

export function VerifyMfaForm({ email }: { email: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(value = code) {
    if (loading) return;
    setError(null);
    setLoading(true);
    const result = await verifyMfaSignIn(value);
    if (!result.success) {
      setError(result.error);
      setCode("");
      setLoading(false);
      return;
    }
    if (result.method === "recovery") {
      toast.warning(
        result.recoveryCodesLeft > 0
          ? `Recovery code used. ${result.recoveryCodesLeft} left. Create new ones in Account → Security.`
          : "That was your last recovery code. Create new ones in Account → Security.",
      );
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function switchAccount() {
    await cancelMfaSignIn();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <main className="bg-popover w-full rounded-xl p-6 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <div className="bg-primary/10 text-primary mb-3 flex size-12 items-center justify-center rounded-full">
          {mode === "totp" ? (
            <ShieldCheck className="size-6" />
          ) : (
            <KeyRound className="size-6" />
          )}
        </div>
        <h1 className="text-2xl font-bold">Two-factor verification</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of the recovery codes you saved when you turned on two-factor authentication."}
          {email && (
            <>
              <br />
              Signing in as{" "}
              <span className="text-foreground font-medium">{email}</span>
            </>
          )}
        </p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === "totp" ? (
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={(value: string) => void submit(value)}
              autoFocus
              disabled={loading}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="^[0-9]*$"
              aria-label="Authenticator code"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-11 text-lg" />
                <InputOTPSlot index={1} className="size-11 text-lg" />
                <InputOTPSlot index={2} className="size-11 text-lg" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="size-11 text-lg" />
                <InputOTPSlot index={4} className="size-11 text-lg" />
                <InputOTPSlot index={5} className="size-11 text-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="recovery-code">Recovery code</Label>
            <Input
              id="recovery-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="xxxx-xxxx"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              disabled={loading}
              className="h-11 font-mono"
            />
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={loading || code.trim().length < 6}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => {
            setMode(mode === "totp" ? "recovery" : "totp");
            setCode("");
            setError(null);
          }}
        >
          {mode === "totp"
            ? "Use a recovery code instead"
            : "Use your authenticator app instead"}
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:underline"
          onClick={() => void switchAccount()}
        >
          Sign in with a different account
        </button>
      </div>
    </main>
  );
}
