/** Data produced by the network collector (Phase 2), as served to the UI. */

export interface CollectorStatus {
  /** Fresh router data for this user (traffic/discovery/health succeeding). */
  running: boolean;
  /** A collector process holds the lease, whether or not its router calls work. */
  alive: boolean;
  heartbeatAt: string | null;
  lastDiscoveryAt: string | null;
  lastError: string | null;
}

export interface LiveTrafficRow {
  address: string;
  deviceId: string | null;
  name: string;
  rateBitsIn: number;
  rateBitsOut: number;
  rateBits: number;
}

export interface TrafficHistoryPoint {
  timestamp: number;
  /** ip → bits/s (in + out) */
  values: Record<string, number>;
}

/** A favorite device for the traffic page's always-visible list. */
export interface FavoriteDevice {
  deviceId: string;
  name: string;
  ipAddress: string;
  isOnline: boolean;
  bytesToday: number;
}

export interface TopConsumer {
  deviceId: string;
  name: string;
  ipAddress: string | null;
  bytesIn: number;
  bytesOut: number;
  dnsQueries: number;
}

export interface UsageBucket {
  bytesIn: number;
  bytesOut: number;
  dnsQueries: number;
  dnsBlocked: number;
}

export interface DeviceUsage {
  hourly: (UsageBucket & { hour: string })[];
  daily: (UsageBucket & { day: string })[];
  totals: { today: number; last7Days: number; last30Days: number };
}

/** One local day of a device's history. */
export interface DeviceDayStats {
  /** Local day, YYYY-MM-DD, in the network's time zone. */
  date: string;
  start: string;
  end: string;
  /** One entry per hour of the day; `label` is the local hour ("14:00"). */
  hourly: (UsageBucket & { hour: string; label: string })[];
  totals: UsageBucket;
  /** Local hour with the most traffic, or null without any. */
  peakHour: { label: string; bytes: number } | null;
  domains: DeviceDomainStat[];
  /** Online/offline changes during the day, oldest first. */
  presence: PresenceEntry[];
  /** Time online during the day; null when no presence was recorded. */
  onlineMs: number | null;
}

export interface DeviceHistory {
  timeZone: string;
  /** Today's local date; the newest day that can be shown. */
  today: string;
  day: DeviceDayStats;
  /** The 30 local days ending on `day.date`, oldest first. */
  daily: (UsageBucket & { date: string })[];
}

export interface DeviceDomainStat {
  domain: string;
  queries: number;
  blocked: number;
}

export interface PresenceEntry {
  online: boolean;
  at: string;
}

export interface RouterInfo {
  name?: string;
  version?: string;
  os?: string;
  uptime?: string;
  loadavg?: string;
  cpuPct?: number;
  memory?: { totalBytes: number; usedBytes: number; usedPct: number };
  disk?: { usedPct?: number; used?: string; size?: string };
  gateways: {
    name: string;
    address?: string;
    status: string;
    delayMs?: number | null;
    lossPct?: number | null;
  }[];
  interfaces: {
    key: string;
    device: string;
    name: string;
    /** null/absent until two counter readings exist */
    rxBps?: number | null;
    txBps?: number | null;
  }[];
}

export interface RouterHealthReport {
  info: RouterInfo | null;
  infoAt: string | null;
  series: {
    timestamp: number;
    cpuPct: number | null;
    memUsedPct: number | null;
    wanRxBps: number | null;
    wanTxBps: number | null;
  }[];
}
