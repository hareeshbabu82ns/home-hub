import Link from "next/link";
import { redirect } from "next/navigation";

import AppTitleLogo from "@/components/AppTitleLogo";
import { getUserAuth } from "@/lib/auth/utils";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserAuth();
  if (session?.session) redirect("/dashboard");

  return (
    <div className="bg-muted flex min-h-dvh flex-col items-center px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:justify-center">
      <Link href="/" className="mb-6" aria-label="Home Hub home">
        <AppTitleLogo />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
