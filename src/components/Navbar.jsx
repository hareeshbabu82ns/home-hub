"use client";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar({
  children,
  actions,
  themeToggle = false,
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-muted border-b-1 border-indigo-600/20 h-14">
      <div className="flex space-x-4">{children}</div>
      <div className="flex space-x-2">
        {actions}
        {themeToggle && <ThemeToggle />}
        {!sidebarOpen && setSidebarOpen && (
          <Button size="sm" variant="icon" onClick={() => setSidebarOpen(true)}>
            <MenuIcon size={24} />
          </Button>
        )}
      </div>
    </header>
  );
}
