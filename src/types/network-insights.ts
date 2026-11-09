/** Data produced by the network collector (Phase 2), as served to the UI. */

export interface CollectorStatus {
  running: boolean;
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
