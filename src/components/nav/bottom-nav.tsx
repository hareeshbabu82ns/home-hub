"use client";

import {
  Bell,
  HomeIcon,
  Menu,
  Router,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useOpenAlertCount } from "@/components/nav/nav-badge";
import { cn } from "@/lib/utils";

const TABS: {
  href: string;
  title: string;
  icon: LucideIcon;
  alerts?: boolean;
}[] = [
  { href: "/dashboard", title: "Home", icon: HomeIcon },
  { href: "/network/devices", title: "Devices", icon: Router },
  { href: "/network/access", title: "Access", icon: ShieldCheck },
  { href: "/network/alerts", title: "Alerts", icon: Bell, alerts: true },
];

/** Phone-only tab bar for the most used screens; "More" opens the full menu. */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const alertCount = useOpenAlertCount();

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-16 grid-cols-5 px-[env(safe-area-inset-left)]">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                <span className="relative">
                  <tab.icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                  {tab.alerts && alertCount > 0 && (
                    <span
                      aria-label={`${alertCount} unread alerts`}
                      className="bg-destructive absolute -top-1.5 -right-2.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums"
                    >
                      {alertCount > 99 ? "99+" : alertCount}
                    </span>
                  )}
                </span>
                {tab.title}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="text-muted-foreground active:text-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium"
          >
            <Menu className="size-5" />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
