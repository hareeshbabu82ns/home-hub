"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { type ClassValue } from "clsx";
import AppTitleLogo from "@/components/AppTitleLogo";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/use-sidebar";
import { type AuthSession } from "@/lib/auth/utils";
import Image from "next/image";

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
  const { isDesktopCollapsed, isHydrated, toggleDesktopCollapsed, isMobile } =
    useSidebar();

  // Add keyboard shortcut for toggling sidebar (Ctrl/Cmd + B)
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

  // Show loading state until hydrated to prevent layout shift
  if (!isHydrated) {
    return (
      <div className={cn("bg-background min-h-screen", classNamePage)}>
        <div className="flex h-screen flex-col lg:flex-row">
          <aside className="lg:border-border lg:bg-muted/30 hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
            <div className="flex h-full flex-col">
              <div className="border-border flex h-14 items-center border-b px-4">
                <AppTitleLogo />
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="animate-pulse p-4">
                  <div className="space-y-3">
                    <div className="bg-muted h-4 rounded">&nbsp;</div>
                    <div className="bg-muted h-4 w-3/4 rounded">&nbsp;</div>
                    <div className="bg-muted h-4 w-1/2 rounded">&nbsp;</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex h-14 items-center border-b backdrop-blur">
              <div className="flex w-full items-center justify-between px-4 py-2 sm:px-6">
                <AppTitleLogo />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
              <div className="animate-pulse p-4">
                <div className="space-y-3">
                  <div className="bg-muted h-8 rounded">&nbsp;</div>
                  <div className="bg-muted h-4 rounded">&nbsp;</div>
                  <div className="bg-muted h-4 w-2/3 rounded">&nbsp;</div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background min-h-screen", classNamePage)}>
      {/* Mobile-first responsive layout */}
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Desktop Sidebar - Hidden on mobile, collapsible on large screens */}
        <aside
          className={cn(
            "lg:border-border lg:bg-muted/30 hidden transition-all duration-300 ease-in-out lg:flex lg:flex-col lg:border-r",
            isDesktopCollapsed ? "lg:w-16" : "lg:w-64",
            classNameSidebar,
          )}
        >
          <div className="flex h-full flex-col">
            <div className="border-border flex h-14 items-center border-b px-4">
              {!isDesktopCollapsed && <AppTitleLogo />}
              {isDesktopCollapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex size-8 items-center justify-center">
                      <Image
                        src="/icon-192.svg"
                        alt="App logo"
                        width={24}
                        height={24}
                        className="size-6 shrink-0 sm:size-7 lg:size-8"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    Home Hub
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar isCollapsed={isDesktopCollapsed} session={session} />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Sheet for sidebar */}
          <Sheet>
            {/* Top Navigation - Always visible with mobile-first design */}
            <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex h-14 items-center border-b backdrop-blur">
              <Navbar
                themeToggle
                sidebarTrigger
                desktopSidebarToggle
                session={session}
              >
                <AppTitleLogo className="lg:hidden" />
              </Navbar>
            </header>

            {/* Mobile Sidebar Sheet */}
            <SheetContent side="left" className="w-70 p-0 sm:w-75">
              <div className="flex h-full flex-col">
                <div className="border-border flex h-14 items-center border-b px-4">
                  <AppTitleLogo />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar session={session} />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div
              className={cn(
                "mx-auto sm:max-w-7xl lg:max-w-none",
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
