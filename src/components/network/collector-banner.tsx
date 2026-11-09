import { TriangleAlert } from "lucide-react";

import type { CollectorStatus } from "@/types/network-insights";

/**
 * Explains why live data is missing. "Not running" (no collector holds the
 * lease) and "running but failing" (router unreachable, secret can't be
 * decrypted…) need different fixes, so they get different messages.
 */
export function CollectorBanner({ status, fallback }: { status: CollectorStatus | null; fallback?: string }) {
  if (!status || status.running) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="min-w-0 space-y-1">
        {status.alive ? (
          <p>
            The background collector is running but isn&apos;t getting data from the router
            {status.lastError ? ":" : "."}
          </p>
        ) : (
          <p>
            The background collector isn&apos;t running. In Docker it starts with the app when{" "}
            <code className="font-mono">NETWORK_COLLECTOR=embedded</code>; check{" "}
            <code className="font-mono">docker compose logs app | grep collector</code>. In development run{" "}
            <code className="font-mono">pnpm collector</code>.
          </p>
        )}
        {status.lastError && <p className="text-destructive font-mono text-xs break-words">{status.lastError}</p>}
        {status.alive && !status.lastError && (
          <p className="text-muted-foreground text-xs">
            Check that the router URL in Settings → Network is reachable from the server and that the API key works.
          </p>
        )}
        {fallback && <p className="text-muted-foreground text-xs">{fallback}</p>}
      </div>
    </div>
  );
}
