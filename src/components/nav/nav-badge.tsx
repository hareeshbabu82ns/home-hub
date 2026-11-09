"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getOpenAlertCount } from "@/lib/actions/network-monitoring";
import { cn } from "@/lib/utils";

export type NavBadgeKey = "network-alerts";

const REFRESH_MS = 60_000;

/** Live count next to a sidebar link; hidden when zero. */
export function NavBadge({ badge, collapsed }: { badge: NavBadgeKey; collapsed?: boolean }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (badge !== "network-alerts") return;
    let cancelled = false;
    const load = () =>
      void getOpenAlertCount().then((result) => {
        if (!cancelled) setCount(result.count);
      });
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // Refresh on navigation too (e.g. after "Mark all read").
  }, [badge, pathname]);

  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} unread alerts`}
      className={cn(
        "bg-destructive text-[10px] font-semibold leading-none text-white tabular-nums",
        collapsed
          ? "ml-0.5 size-1.5 self-start rounded-full p-0 text-transparent"
          : "ml-auto rounded-full px-1.5 py-0.5",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
