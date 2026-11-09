import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Sign-in problem" };

const MESSAGES: Record<string, string> = {
  AccessDenied: "This account isn't allowed to sign in.",
  Configuration:
    "Sign-in isn't configured correctly on the server. Ask the administrator to check the logs.",
  Verification: "The sign-in link expired or was already used.",
  OAuthAccountNotLinked:
    "That email is already registered with a different sign-in method. Sign in the way you did before.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ||
    "Something went wrong while signing you in. Please try again.";

  return (
    <main className="bg-popover w-full rounded-xl p-6 text-center shadow-sm sm:p-10">
      <h1 className="text-2xl font-bold">Couldn&apos;t sign you in</h1>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
      <Button asChild className="mt-6 h-11 w-full">
        <Link href="/sign-in">Back to sign in</Link>
      </Button>
    </main>
  );
}
