"use client";

import { Button } from "@/components/ui/button";

import ThemeToggle from "./theme-toggle";
import { SheetTrigger } from "./ui/sheet";
import { MenuIcon } from "lucide-react";

export default function Navbar({
  children,
  actions,
  sidebarTrigger = false,
  themeToggle = false,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  sidebarTrigger?: boolean;
  themeToggle?: boolean;
}) {
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
        <div className="flex items-center">{children}</div>
      </div>

      {/* Right side - Actions and theme toggle */}
      <div className="flex items-center gap-2">
        {actions}
        {themeToggle && <ThemeToggle />}
      </div>
    </nav>
  );
}
