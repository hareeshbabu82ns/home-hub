import { checkAuth } from "@/lib/auth/utils";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import NextAuthProvider from "@/lib/auth/Provider";
import { cn } from "@/lib/utils";
import { type ClassValue } from "clsx";
import AppTitleLogo from "@/components/AppTitleLogo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();
  return (
    <main>
      <NextAuthProvider>
        <WithNavSidebar>{children}</WithNavSidebar>
      </NextAuthProvider>

      <Toaster richColors />
    </main>
  );
}

function WithNavSidebar({
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
    <div
      className={cn(
        "h-screen flex-1 items-start md:grid md:grid-cols-[260px_minmax(0,1fr)]",
        classNamePage,
      )}
    >
      <aside
        className={cn(
          "border-border hidden h-screen w-full min-w-52 shrink-0 border-r shadow-inner md:sticky md:block",
          classNameSidebar,
        )}
      >
        <Sidebar />
      </aside>
      <section className="flex h-screen flex-1 flex-col overflow-hidden">
        <Sheet>
          <Navbar themeToggle sidebarTrigger>
            <AppTitleLogo className="flex md:hidden" />
          </Navbar>
          <SheetContent side="left" className="w-[260px] overflow-y-auto p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className={cn("md:py px-4 py-2 md:px-6", classNameContents)}>
            {children}
          </div>
        </main>
      </section>
    </div>
  );
}
