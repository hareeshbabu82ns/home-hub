"use client";

import { cn } from "@/lib/utils";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import Navbar from "./Navbar";
import AppTitleLogo from "./AppTitleLogo";

const WithDesktopSidebar = ({
  children,
  sidebarContent: SidebarContent,
  navbarContent: NavbarContent,
  navbarContentMobile: NavbarContentMobile,
  classNameMobileSheetContent,
  className,
  classNamePage,
  classNameSidebar,
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
    // style used from here -> https://github.com/shadcn-ui/ui/blob/1cf5fad881b1da8f96923b7ad81d22d0aa3574b9/apps/www/app/docs/layout.tsx#L12
    <div
      className={cn(
        "h-screen flex-1 items-start md:grid md:grid-cols-[260px_minmax(0,1fr)]",
        classNamePage
      )}
    >
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className={cn(
            "p-0 overflow-y-auto w-[260px]",
            classNameMobileSheetContent
          )}
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "h-screen min-w-52 hidden w-full shrink-0 border-r border-border md:sticky md:block shadow-inner",
          classNameSidebar
        )}
      >
        <SidebarContent />
      </aside>

      <section className="h-screen flex-1 flex flex-col overflow-hidden">
        {NavbarContent && (
          <div className="hidden md:block">
            <NavbarContent />
          </div>
        )}

        <div className="block md:hidden">
          {NavbarContentMobile ? (
            <NavbarContentMobile
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          ) : (
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <AppTitleLogo />
            </Navbar>
          )}
        </div>

        <main class="flex-1 overflow-x-hidden overflow-y-auto">
          <div className={cn("px-4 md:px-6 py-2 md:py", className)}>
            {children}
          </div>
        </main>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const WithSidebar = ({ children, ...props }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <WithDesktopSidebar
      {...props}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {children}
    </WithDesktopSidebar>
  );
};
