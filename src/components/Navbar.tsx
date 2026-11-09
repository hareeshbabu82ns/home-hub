"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";

import ThemeToggle from "./theme-toggle";
import { SheetTrigger } from "./ui/sheet";
import {
  MenuIcon,
  PanelLeftOpenIcon,
  PanelLeftCloseIcon,
  Cog,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import Link from "next/link";
import type { AuthSession } from "@/lib/auth/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

export default function Navbar({
  children,
  actions,
  sidebarTrigger = false,
  themeToggle = false,
  desktopSidebarToggle = false,
  session,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  sidebarTrigger?: boolean;
  themeToggle?: boolean;
  desktopSidebarToggle?: boolean;
  session?: AuthSession;
}) {
  const { toggleDesktopCollapsed, isDesktopCollapsed } = useSidebar();

  return (
    <nav className="flex w-full items-center justify-between px-4 py-2 sm:px-6">
      {/* Left side - Logo and hamburger menu */}
      <div className="flex items-center gap-3">
        {sidebarTrigger && (
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        )}
        {desktopSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={toggleDesktopCollapsed}
            aria-label={
              isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={`${isDesktopCollapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpenIcon className="h-5 w-5" />
            ) : (
              <PanelLeftCloseIcon className="h-5 w-5" />
            )}
          </Button>
        )}
        <div className="flex items-center">{children}</div>
      </div>

      {/* Right side - Actions and theme toggle */}
      <div className="flex items-center gap-2">
        {actions}
        {themeToggle && <ThemeToggle />}

        {/* User menu on far right */}
        {session?.session && session.session.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="border-border border text-xs">
                    {session.session.user.name
                      ? session.session.user.name
                          .split(" ")
                          .map((w: string) => w[0].toUpperCase())
                          .join("")
                      : "~"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">
                  {session.session.user.name}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {session.session.user.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account" className="flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* end user menu */}
      </div>
    </nav>
  );
}
