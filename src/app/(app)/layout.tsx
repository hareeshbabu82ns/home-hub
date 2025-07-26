import { checkAuth, getUserAuth } from "@/lib/auth/utils";
import { Toaster } from "@/components/ui/sonner";
import NextAuthProvider from "@/lib/auth/Provider";
import { MobileFirstLayout } from "./MobileFirstLayout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();
  const session = await getUserAuth();

  return (
    <NextAuthProvider>
      <MobileFirstLayout session={session}>{children}</MobileFirstLayout>
      <Toaster richColors />
    </NextAuthProvider>
  );
}
