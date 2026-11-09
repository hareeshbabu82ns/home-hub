"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getOpenAlertCount } from "@/lib/actions/network-monitoring";
import { cn } from "@/lib/utils";

export type NavBadgeKey = "network-alerts";

const REFRESH_MS = 60_000;

/**
 * Unread network alert count, shared by every badge on screen (sidebar, rail,
 * tab bar) through one react-query cache entry.
 */
export function useOpenAlertCount() {
  const pathname = usePathname();
  const query = useQuery({
    queryKey: ["network-alerts", "open-count"],
    queryFn: async () => (await getOpenAlertCount()).count,
    refetchInterval: REFRESH_MS,
    staleTime: 10_000,
  });
  const { refetch } = query;

  // Refresh on navigation too (e.g. after "Mark all read").
  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  return query.data ?? 0;
}

/** Live count next to a sidebar link; hidden when zero. */
export function NavBadge({ badge, collapsed }: { badge: NavBadgeKey; collapsed?: boolean }) {
  const count = useOpenAlertCount();

  if (badge !== "network-alerts" || count === 0) return null;
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
