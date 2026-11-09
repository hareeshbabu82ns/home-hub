"use client";

import { atom, useAtom } from "jotai";
import { useIsMobile } from "./use-mobile";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

// Jotai atoms for sidebar state
const sidebarMobileOpenAtom = atom(false);
const sidebarDesktopCollapsedAtom = atom(false);

export function useSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useAtom(sidebarMobileOpenAtom);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useAtom(
    sidebarDesktopCollapsedAtom,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Load desktop collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsDesktopCollapsed(JSON.parse(stored));
    }
    setIsHydrated(true);
  }, [setIsDesktopCollapsed]);

  // Save desktop collapsed state to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify(isDesktopCollapsed),
      );
    }
  }, [isDesktopCollapsed, isHydrated]);

  const toggleMobile = useCallback(
    () => setIsMobileOpen((prev) => !prev),
    [setIsMobileOpen],
  );
  const closeMobile = useCallback(
    () => setIsMobileOpen(false),
    [setIsMobileOpen],
  );
  const openMobile = useCallback(
    () => setIsMobileOpen(true),
    [setIsMobileOpen],
  );

  const toggleDesktopCollapsed = () =>
    setIsDesktopCollapsed(!isDesktopCollapsed);
  const setDesktopCollapsed = (collapsed: boolean) =>
    setIsDesktopCollapsed(collapsed);

  // Auto-close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      closeMobile();
    }
  }, [pathname, isMobile, isMobileOpen, closeMobile]);

  // Close mobile sidebar when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && isMobileOpen) {
      closeMobile();
    }
  }, [isMobile, isMobileOpen, closeMobile]);

  return {
    // Mobile sidebar state
    isMobileOpen,
    setIsMobileOpen,
    toggleMobile,
    closeMobile,
    openMobile,

    // Desktop sidebar state
    isDesktopCollapsed,
    setDesktopCollapsed,
    toggleDesktopCollapsed,

    // Utilities
    isMobile,
    isHydrated,

    // Legacy support
    isOpen: isMobile ? isMobileOpen : false,
    setIsOpen: setIsMobileOpen,
    toggle: toggleMobile,
    close: closeMobile,
    open: openMobile,
  };
}
