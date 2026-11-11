import { Ban, CalendarClock, Fingerprint, Gauge, Globe, Pause, ShieldAlert, Star, Timer, Waypoints } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { describeAllowance, describeReason } from "@/lib/network/access-policy";
import type { NetworkDevice } from "@/types/network";

type BadgeFields = Pick<
  NetworkDevice,
  "isOnline" | "isNew" | "isBlocked" | "role" | "isUpstream" | "isRandomMac" | "access"
>;

const REASON_ICON = {
  manual: Ban,
  paused: Pause,
  schedule: CalendarClock,
  quarantine: ShieldAlert,
  quota: Gauge,
} as const;

export function OnlineDot({ isOnline }: { isOnline: boolean }) {
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
      title={isOnline ? "Online" : "Offline"}
      aria-label={isOnline ? "Online" : "Offline"}
    />
  );
}

/** Star toggle; a plain (non-interactive) star when `onToggle` is omitted. */
export function FavoriteStar({
  isFavorite,
  onToggle,
  disabled,
  className = "",
}: {
  isFavorite: boolean;
  onToggle?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const star = (
    <Star className={`size-4 ${isFavorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground/50"}`} />
  );
  if (!onToggle) {
    return isFavorite ? (
      <span className={`shrink-0 ${className}`} title="Favorite" aria-label="Favorite">
        {star}
      </span>
    ) : null;
  }
  return (
    <button
      type="button"
      className={`hover:bg-muted shrink-0 rounded p-1 disabled:opacity-50 ${className}`}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={disabled}
      onClick={() => onToggle(!isFavorite)}
    >
      {star}
    </button>
  );
}

export function DeviceBadges({ device }: { device: BadgeFields }) {
  return (
    <div className="flex flex-wrap gap-1">
      {device.access?.reasons.length
        ? device.access.reasons.map((reason) => {
            const Icon = REASON_ICON[reason.kind];
            return (
              <Badge key={JSON.stringify(reason)} variant="destructive" className="gap-1">
                <Icon className="size-3" />
                {describeReason(reason)}
              </Badge>
            );
          })
        : device.isBlocked && (
            <Badge variant="destructive" className="gap-1">
              <Ban className="size-3" />
              Blocked
            </Badge>
          )}
      {device.access?.allowedUntil && (
        <Badge
          variant="secondary"
          className="gap-1"
          title={
            device.access.suspended.length
              ? `Then: ${device.access.suspended.map(describeReason).join(", ")}`
              : undefined
          }
        >
          <Timer className="size-3" />
          {describeAllowance(device.access.allowedUntil)}
        </Badge>
      )}
      {device.isNew && !device.access?.reasons.some((r) => r.kind === "quarantine") && (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="size-3" />
          New
        </Badge>
      )}
      {device.role === "INFRASTRUCTURE" && (
        <Badge
          variant="outline"
          className="gap-1"
          title="The router's own address or an upstream gateway"
        >
          <Waypoints className="size-3" />
          Router/Gateway
        </Badge>
      )}
      {device.isUpstream && device.role !== "INFRASTRUCTURE" && (
        <Badge
          variant="outline"
          className="gap-1"
          title="Seen on the WAN side; LAN firewall rules don't filter it"
        >
          <Globe className="size-3" />
          WAN
        </Badge>
      )}
      {device.isRandomMac && (
        <Badge
          variant="secondary"
          className="gap-1"
          title="Private (randomised) MAC address. The device may appear as new if it rotates it."
        >
          <Fingerprint className="size-3" />
          Private MAC
        </Badge>
      )}
    </div>
  );
}

/** Why the Block action is unavailable, or null when it is allowed. */
export function blockDisabledReason(
  device: Pick<NetworkDevice, "role" | "isUpstream" | "isBlocked">,
): string | null {
  if (device.isBlocked) return null; // unblocking is always allowed
  if (device.role === "INFRASTRUCTURE") {
    return "Router and gateway addresses can't be blocked";
  }
  if (device.isUpstream) {
    return "WAN-side device: LAN firewall rules don't filter it";
  }
  return null;
}
