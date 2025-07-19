"use client";

import { atom, useAtom } from "jotai";
import { useIsMobile } from "./use-mobile";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Jotai atom for sidebar state
const sidebarOpenAtom = atom(false);

export function useSidebar() {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && isOpen) {
      close();
    }
  }, [pathname, isMobile, isOpen]);

  // Close sidebar when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      close();
    }
  }, [isMobile, isOpen]);

  return {
    isOpen: isMobile ? isOpen : false, // Only show mobile state on mobile
    setIsOpen,
    toggle,
    close,
    open,
    isMobile,
  };
}
