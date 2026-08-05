export interface NetworkDevice {
  id: string;
  userId: string;
  name: string | null;
  hostname: string | null;
  ipAddress: string;
  macAddress: string | null;
  vendor: string | null;
  deviceType: string | null;
  intf: string | null;
  intfDescription: string | null;
  isNew: boolean;
  isBlocked: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateNetworkDeviceInput {
  id: string;
  name?: string;
  hostname?: string;
  macAddress?: string;
  vendor?: string;
  deviceType?: string;
  intf?: string;
  intfDescription?: string;
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
