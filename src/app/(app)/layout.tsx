import { checkAuth } from "@/lib/auth/utils";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import NextAuthProvider from "@/lib/auth/Provider";
import { cn } from "@/lib/utils";
import { type ClassValue } from "clsx";
import AppTitleLogo from "@/components/AppTitleLogo";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();
  return (
    <NextAuthProvider>
      <MobileFirstLayout>{children}</MobileFirstLayout>
      <Toaster richColors />
    </NextAuthProvider>
  );
}

function MobileFirstLayout({
  children,
  classNamePage,
  classNameSidebar,
  classNameContents,
}: {
  children: React.ReactNode;
  classNamePage?: ClassValue;
  classNameSidebar?: ClassValue;
  classNameContents?: ClassValue;
}) {
  return (
    <div className={cn("bg-background min-h-screen", classNamePage)}>
      {/* Mobile-first responsive layout */}
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Desktop Sidebar - Hidden on mobile, visible on large screens */}
        <aside
          className={cn(
            "lg:border-border lg:bg-muted/30 hidden lg:flex lg:w-64 lg:flex-col lg:border-r",
            classNameSidebar,
          )}
        >
          <div className="flex h-full flex-col">
            <div className="border-border flex h-14 items-center border-b px-4">
              <AppTitleLogo />
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Sheet for sidebar */}
          <Sheet>
            {/* Top Navigation - Always visible with mobile-first design */}
            <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-14 items-center border-b backdrop-blur">
              <Navbar themeToggle sidebarTrigger>
                <AppTitleLogo className="lg:hidden" />
              </Navbar>
            </header>

            {/* Mobile Sidebar Sheet */}
            <SheetContent side="left" className="w-[280px] p-0 sm:w-[300px]">
              <div className="flex h-full flex-col">
                <div className="border-border flex h-14 items-center border-b px-4">
                  <AppTitleLogo />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div
              className={cn(
                "container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8",
                classNameContents,
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
