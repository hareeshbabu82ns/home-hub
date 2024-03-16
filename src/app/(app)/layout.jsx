import { checkAuth } from "@/lib/auth/utils";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AppTitleLogo from "@/components/AppTitleLogo";
import NextAuthProvider from "@/lib/auth/Provider";
import { WithSidebar } from "@/components/WithSidebar";

export default async function AppLayout({ children }) {
  await checkAuth();
  return (
    <>
      <NextAuthProvider>
        <WithSidebar
          sidebarContent={Sidebar}
          navbarContent={Navbar}
          // navbarContentMobile={Navbar}
        >
          {children}
        </WithSidebar>
      </NextAuthProvider>

      <Toaster richColors />
    </>
  );
}
