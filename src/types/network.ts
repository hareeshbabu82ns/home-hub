import type { AccessDecision } from "@/lib/network/access-policy";

export type NetworkDeviceRole = "CLIENT" | "INFRASTRUCTURE";

export interface NetworkDeviceAddress {
  id: string;
  ip: string;
  family: string;
  source: string;
  intf: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface NetworkDevice {
  id: string;
  userId: string;
  macAddress: string;
  ipAddress: string;
  name: string | null;
  hostname: string | null;
  dhcpHostname: string | null;
  vendor: string | null;
  deviceType: string | null;
  intf: string | null;
  intfDescription: string | null;
  role: NetworkDeviceRole;
  isUpstream: boolean;
  isRandomMac: boolean;
  isOnline: boolean;
  isNew: boolean;
  isBlocked: boolean;
  /** Desired-state fields (MAC control mode). */
  blocked?: boolean | null;
  pausedUntil?: Date | string | null;
  /** Why the device is (or would be) blocked; present in MAC control mode. */
  access?: AccessDecision;
  firstSeenAt: Date;
  lastSeenAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  addresses?: NetworkDeviceAddress[];
}

/** Router-owned fields (MAC, IP, interface) are not editable. */
export interface UpdateNetworkDeviceInput {
  id: string;
  name?: string;
  hostname?: string;
  vendor?: string;
  deviceType?: string;
  notes?: string;
  isNew?: boolean;
}

export interface NetworkTrafficDetail {
  address: string;
  rate?: string;
  rateBits: number;
  cumulative?: string;
  cumulativeBytes?: number;
  tags: string[];
}

export interface NetworkTrafficRecord {
  address: string;
  displayName: string;
  rateBitsIn: number;
  rateBitsOut: number;
  rateBits: number;
  cumulativeBytesIn: number;
  cumulativeBytesOut: number;
  cumulativeBytes: number;
  tags: string[];
  details: NetworkTrafficDetail[];
  rname: string;
  rateIn?: string;
  rateOut?: string;
  rate?: string;
  cumulativeIn?: string;
  cumulativeOut?: string;
  cumulative?: string;
}

export interface NetworkTrafficSnapshot {
  records: NetworkTrafficRecord[];
  fetchedAt: string;
}

export interface NetworkDnsQueryRow {
  uuid: string | null;
  time: number;
  client: string;
  family: string;
  type: string;
  domain: string;
  action: string;
  source: string;
  blocklist: string;
  rcode: string;
  resolveTimeMs: number;
  dnssecStatus: string;
  ttl: number;
  policy: string;
  status: number;
}

export interface NetworkDnsQueryResult {
  total: number;
  rowCount: number;
  current: number;
  rows: NetworkDnsQueryRow[];
}
