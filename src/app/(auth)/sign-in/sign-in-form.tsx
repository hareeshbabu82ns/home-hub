"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signInWithProvider } from "@/lib/actions/auth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function SignInForm({
  providers,
}: {
  providers: { google: boolean; github: boolean };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(result.mfaRequired ? "/verify-mfa" : "/dashboard");
        router.refresh();
      }
    } catch (_err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <main className="bg-popover w-full rounded-xl p-6 shadow-sm sm:p-10">
      <h1 className="text-center text-2xl font-bold">
        Sign in to your account
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <Link
          href="/forgot-password"
          className="text-primary text-sm hover:underline"
        >
          Forgot your password?
        </Link>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {(providers.google || providers.github) && (
        <>
          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs uppercase">or</span>
            <Separator className="flex-1" />
          </div>
          <form action={signInWithProvider} className="grid gap-2">
            {providers.google && (
              <Button
                type="submit"
                name="provider"
                value="google"
                variant="outline"
                className="h-11 w-full"
              >
                Continue with Google
              </Button>
            )}
            {providers.github && (
              <Button
                type="submit"
                name="provider"
                value="github"
                variant="outline"
                className="h-11 w-full"
              >
                Continue with GitHub
              </Button>
            )}
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm">
        Do not have an account?{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
