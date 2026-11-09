"use client";

import { useEffect } from "react";
import Image from "next/image";
import { type ClassValue } from "clsx";

import AppTitleLogo from "@/components/AppTitleLogo";
import Navbar from "@/components/Navbar";
import { BottomNav } from "@/components/nav/bottom-nav";
import Sidebar from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/use-sidebar";
import { type AuthSession } from "@/lib/auth/utils";
import { cn } from "@/lib/utils";

/**
 * App shell, phone/tablet first:
 *
 * - phone (< md):      top bar + bottom tab bar; full menu in a sheet
 * - iPad portrait (md): icon rail on the left
 * - iPad landscape / desktop (lg+): full sidebar, collapsible (Ctrl/Cmd+B)
 *
 * Breakpoints are pure CSS so the first (server) render already has the
 * right layout. Safe-area insets keep content clear of the notch and home
 * indicator in the installed app (viewport-fit=cover).
 */
export function MobileFirstLayout({
  children,
  session,
  classNamePage,
  classNameSidebar,
  classNameContents,
}: {
  children: React.ReactNode;
  session: AuthSession;
  classNamePage?: ClassValue;
  classNameSidebar?: ClassValue;
  classNameContents?: ClassValue;
}) {
  const { isDesktopCollapsed, toggleDesktopCollapsed, isMobile, isMobileOpen, setIsMobileOpen } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "b" && !isMobile) {
        event.preventDefault();
        toggleDesktopCollapsed();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleDesktopCollapsed, isMobile]);

  return (
    <div className={cn("bg-background flex h-dvh overflow-hidden", classNamePage)}>
      {/* iPad portrait: icon rail */}
      <aside
        className={cn(
          "border-border bg-muted/30 hidden w-16 shrink-0 flex-col border-r pl-[env(safe-area-inset-left)] md:flex lg:hidden",
          classNameSidebar,
        )}
      >
        <div className="border-border flex h-14 shrink-0 items-center justify-center border-b pt-[env(safe-area-inset-top)] box-content">
          <RailLogo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar isCollapsed session={session} />
        </div>
      </aside>

      {/* Landscape / desktop: full sidebar */}
      <aside
        className={cn(
          "border-border bg-muted/30 hidden shrink-0 flex-col border-r pl-[env(safe-area-inset-left)] transition-[width] duration-300 ease-in-out lg:flex",
          isDesktopCollapsed ? "w-16" : "w-64",
          classNameSidebar,
        )}
      >
        <div className="border-border box-content flex h-14 shrink-0 items-center border-b px-4 pt-[env(safe-area-inset-top)]">
          {isDesktopCollapsed ? <RailLogo /> : <AppTitleLogo />}
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar isCollapsed={isDesktopCollapsed} session={session} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/70 z-40 shrink-0 border-b pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] backdrop-blur">
            <div className="flex h-14 items-center">
              <Navbar themeToggle sidebarTrigger desktopSidebarToggle session={session}>
                <AppTitleLogo className="lg:hidden" />
              </Navbar>
            </div>
          </header>

          <SheetContent
            side="left"
            className="w-[min(20rem,85vw)] p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
                <AppTitleLogo />
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar session={session} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <main
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain pr-[env(safe-area-inset-right)]",
            // Room for the bottom tab bar on phones.
            "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)]",
          )}
        >
          <div className={cn("mx-auto sm:max-w-7xl lg:max-w-none", classNameContents)}>{children}</div>
        </main>

        <BottomNav onMore={() => setIsMobileOpen(true)} />
      </div>
    </div>
  );
}

function RailLogo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex size-8 items-center justify-center">
          <Image src="/icon-192.svg" alt="Home Hub" width={28} height={28} className="size-7 shrink-0" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="ml-2">
        Home Hub
      </TooltipContent>
    </Tooltip>
  );
}
