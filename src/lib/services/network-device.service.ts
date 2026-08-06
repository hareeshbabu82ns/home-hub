import { networkDeviceRepository } from "@/lib/db/repositories";
import type { NetworkDnsQueryResult, NetworkDnsQueryRow } from "@/types/network";

interface ScanResult {
  devices: Awaited<ReturnType<typeof networkDeviceRepository.findManyByUser>>;
  scannedCount: number;
  newCount: number;
}

interface NetworkDeviceUpdateInput {
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

interface AliasSearchRow {
  name?: string;
  content?: string;
}

interface DiscoveredDevice {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  vendor?: string;
  deviceType?: string;
  intf?: string;
  intfDescription?: string;
}

interface DnsSearchQueriesPayload {
  total: number;
  rowCount: number;
  current: number;
  rows: NetworkDnsQueryRow[];
}

function asString( value: unknown ): string | undefined {
  if ( typeof value === "string" ) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function asNumber( value: unknown, fallback = 0 ): number {
  if ( typeof value === "number" && Number.isFinite( value ) ) {
    return value;
  }

  if ( typeof value === "string" ) {
    const parsed = Number( value );
    if ( Number.isFinite( parsed ) ) {
      return parsed;
    }
  }

  return fallback;
}

function pickField(
  row: Record<string, unknown>,
  candidates: string[],
): string | undefined {
  for ( const key of candidates ) {
    const value = asString( row[ key ] );
    if ( value ) return value;
  }

  return undefined;
}

function mapDiscoveredDevices( payload: unknown ): DiscoveredDevice[] {
  if ( typeof payload !== "object" || payload === null ) {
    return [];
  }

  const objectPayload = payload as Record<string, unknown>;
  const rowsUnknown =
    ( Array.isArray( objectPayload.rows ) && objectPayload.rows ) ||
    ( Array.isArray( objectPayload.data ) && objectPayload.data ) ||
    ( Array.isArray( objectPayload.items ) && objectPayload.items ) ||
    [];

  const discoveredDevices: DiscoveredDevice[] = [];

  for ( const row of rowsUnknown ) {
    if ( typeof row !== "object" || row === null ) continue;

    const rowObject = row as Record<string, unknown>;
    const ipAddress = pickField( rowObject, [
      "ip",
      "ipAddress",
      "ip_address",
      "address",
    ] );

    if ( !ipAddress ) continue;

    const macAddress = pickField( rowObject, [
      "mac",
      "macAddress",
      "mac_address",
    ] );
    const hostname = pickField( rowObject, [ "hostname", "host", "name" ] );
    const vendor = pickField( rowObject, [ "vendor", "manufacturer" ] );
    const deviceType = pickField( rowObject, [
      "deviceType",
      "device_type",
      "type",
      "interface",
    ] );
    const intf = pickField( rowObject, [
      "intf",
      "interface",
      "if",
    ] );
    const intfDescription = pickField( rowObject, [
      "intf_description",
      "intfDescription",
      "interface_description",
      "interfaceDescription",
    ] );

    discoveredDevices.push( {
      ipAddress,
      macAddress,
      hostname,
      vendor,
      deviceType,
      intf,
      intfDescription,
    } );
  }

  return discoveredDevices;
}

function mapDnsSearchQueries( payload: unknown ): DnsSearchQueriesPayload {
  if ( typeof payload !== "object" || payload === null ) {
    return {
      total: 0,
      rowCount: 0,
      current: 1,
      rows: [],
    };
  }

  const objectPayload = payload as Record<string, unknown>;
  const rowsUnknown = Array.isArray( objectPayload.rows ) ? objectPayload.rows : [];

  const rows = rowsUnknown
    .filter( ( row ) => typeof row === "object" && row !== null )
    .map( ( row ) => {
      const rowObject = row as Record<string, unknown>;

      return {
        uuid:
          typeof rowObject.uuid === "string" || rowObject.uuid === null
            ? rowObject.uuid
            : null,
        time: asNumber( rowObject.time ),
        client: asString( rowObject.client ) || "",
        family: asString( rowObject.family ) || "",
        type: asString( rowObject.type ) || "",
        domain: asString( rowObject.domain ) || "",
        action: asString( rowObject.action ) || "",
        source: asString( rowObject.source ) || "",
        blocklist: asString( rowObject.blocklist ) || "",
        rcode: asString( rowObject.rcode ) || "",
        resolveTimeMs: asNumber( rowObject.resolve_time_ms ),
        dnssecStatus: asString( rowObject.dnssec_status ) || "",
        ttl: asNumber( rowObject.ttl ),
        policy: asString( rowObject.policy ) || "",
        status: asNumber( rowObject.status ),
      };
    } );

  return {
    total: asNumber( objectPayload.total ),
    rowCount: asNumber( objectPayload.rowCount ),
    current: asNumber( objectPayload.current, 1 ),
    rows,
  };
}

async function discoverFromRouterApi( input: {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  verifyTls: boolean;
  subnet?: string;
} ): Promise<DiscoveredDevice[]> {
  const baseUrl = input.apiBaseUrl.replace( /\/$/, "" );
  const url = `${baseUrl}/api/diagnostics/interface/search_arp`;

  const credentials = Buffer.from( `${input.apiKey}:${input.apiSecret}` ).toString(
    "base64",
  );

  const body = {
    current: 1,
    rowCount: 1000,
    sort: {},
    resolve: "no",
    subnet: input.subnet,
  };

  const originalTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if ( !input.verifyTls ) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  let response: Response;
  try {
    response = await fetch( url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify( body ),
    } );
  } finally {
    if ( !input.verifyTls ) {
      if ( typeof originalTlsSetting === "string" ) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsSetting;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  }

  if ( !response.ok ) {
    throw new Error( `Router API responded with ${response.status}` );
  }

  const payload = ( await response.json() ) as unknown;
  return mapDiscoveredDevices( payload );
}

async function setBlockedStateOnRouter( input: {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  verifyTls: boolean;
  ipAddress: string;
  isBlocked: boolean;
} ): Promise<void> {
  const baseUrl = input.apiBaseUrl.replace( /\/$/, "" );
  const action = input.isBlocked ? "add" : "delete";
  const url = `${baseUrl}/api/firewall/alias_util/${action}/Blocked_Devices`;

  const credentials = Buffer.from( `${input.apiKey}:${input.apiSecret}` ).toString(
    "base64",
  );

  const originalTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if ( !input.verifyTls ) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  let response: Response;
  try {
    response = await fetch( url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify( {
        address: input.ipAddress,
      } ),
    } );
  } finally {
    if ( !input.verifyTls ) {
      if ( typeof originalTlsSetting === "string" ) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsSetting;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  }

  if ( !response.ok ) {
    throw new Error( `Router API responded with ${response.status}` );
  }
}

function parseBlockedAddresses( content: string | undefined ): Set<string> {
  if ( !content ) {
    return new Set();
  }

  const items = content
    .split( /[\n,;\s]+/ )
    .map( ( item ) => item.trim() )
    .filter( Boolean );

  return new Set( items );
}

async function searchAliasFromRouter( input: {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  verifyTls: boolean;
} ): Promise<AliasSearchRow[]> {
  const baseUrl = input.apiBaseUrl.replace( /\/$/, "" );
  const url = `${baseUrl}/api/firewall/alias/search_item`;

  const credentials = Buffer.from( `${input.apiKey}:${input.apiSecret}` ).toString(
    "base64",
  );

  const originalTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if ( !input.verifyTls ) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  let response: Response;
  try {
    response = await fetch( url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify( {
        current: 1,
        rowCount: 50,
        sort: {},
        searchPhrase: "Blocked_Devices",
      } ),
    } );
  } finally {
    if ( !input.verifyTls ) {
      if ( typeof originalTlsSetting === "string" ) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsSetting;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  }

  if ( !response.ok ) {
    throw new Error( `Router API responded with ${response.status}` );
  }

  const payload = ( await response.json() ) as unknown;
  if ( typeof payload !== "object" || payload === null ) {
    return [];
  }

  const rows = ( payload as Record<string, unknown> ).rows;
  if ( !Array.isArray( rows ) ) {
    return [];
  }

  return rows
    .filter( ( row ) => typeof row === "object" && row !== null )
    .map( ( row ) => row as AliasSearchRow );
}

async function searchDnsQueriesFromRouter( input: {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  verifyTls: boolean;
  clientIp: string;
  current?: number;
  rowCount?: number;
  action?: string;
} ): Promise<DnsSearchQueriesPayload> {
  const baseUrl = input.apiBaseUrl.replace( /\/$/, "" );
  const url = `${baseUrl}/api/unbound/overview/search_queries`;

  const credentials = Buffer.from( `${input.apiKey}:${input.apiSecret}` ).toString(
    "base64",
  );

  const originalTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if ( !input.verifyTls ) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  let response: Response;
  try {
    const requestBody: {
      current: number;
      rowCount: number;
      client: string;
      action?: string;
    } = {
      current: input.current ?? 1,
      rowCount: input.rowCount ?? 50,
      client: input.clientIp,
    };

    if ( input.action ) {
      requestBody.action = input.action;
    }

    response = await fetch( url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify( requestBody ),
    } );
  } finally {
    if ( !input.verifyTls ) {
      if ( typeof originalTlsSetting === "string" ) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsSetting;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  }

  if ( !response.ok ) {
    throw new Error( `Router API responded with ${response.status}` );
  }

  const payload = ( await response.json() ) as unknown;
  return mapDnsSearchQueries( payload );
}

class NetworkDeviceService {
  async list( userId: string, search?: string ) {
    return networkDeviceRepository.findManyByUser( { userId, search } );
  }

  async getById( userId: string, id: string ) {
    return networkDeviceRepository.findById( id, userId );
  }

  async scanAndSave(
    userId: string,
    config: {
      apiBaseUrl: string;
      apiKey: string;
      apiSecret: string;
      verifyTls: boolean;
      subnet?: string;
    },
  ): Promise<ScanResult> {
    const existing = await networkDeviceRepository.findManyByUser( { userId } );
    const knownIps = new Set( existing.map( ( device ) => device.ipAddress ) );

    const discovered = await discoverFromRouterApi( {
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      verifyTls: config.verifyTls,
      subnet: config.subnet,
    } );

    const now = new Date();

    await Promise.all(
      discovered.map( ( device ) =>
        networkDeviceRepository.upsertByUserAndIp( userId, device.ipAddress, {
          hostname: device.hostname,
          macAddress: device.macAddress,
          vendor: device.vendor,
          deviceType: device.deviceType,
          intf: device.intf,
          intfDescription: device.intfDescription,
          isNewOnCreate: !knownIps.has( device.ipAddress ),
          firstSeenAt: now,
          lastSeenAt: now,
        } ),
      ),
    );

    const devices = await networkDeviceRepository.findManyByUser( { userId } );
    const newCount = devices.filter( ( device ) => device.isNew ).length;

    return {
      devices,
      scannedCount: discovered.length,
      newCount,
    };
  }

  async update( userId: string, id: string, input: NetworkDeviceUpdateInput ) {
    const device = await networkDeviceRepository.findById( id, userId );
    if ( !device ) {
      throw new Error( "Device not found" );
    }

    return networkDeviceRepository.update( id, userId, input );
  }

  async delete( userId: string, id: string ) {
    const device = await networkDeviceRepository.findById( id, userId );
    if ( !device ) {
      throw new Error( "Device not found" );
    }

    return networkDeviceRepository.delete( id, userId );
  }

  async markReviewed( userId: string, id: string ) {
    return this.update( userId, id, { isNew: false } );
  }

  async setBlockedState(
    userId: string,
    id: string,
    config: {
      apiBaseUrl: string;
      apiKey: string;
      apiSecret: string;
      verifyTls: boolean;
    },
    isBlocked: boolean,
  ) {
    const device = await networkDeviceRepository.findById( id, userId );
    if ( !device ) {
      throw new Error( "Device not found" );
    }

    await setBlockedStateOnRouter( {
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      verifyTls: config.verifyTls,
      ipAddress: device.ipAddress,
      isBlocked,
    } );
  }

  async getBlockedAddresses( config: {
    apiBaseUrl: string;
    apiKey: string;
    apiSecret: string;
    verifyTls: boolean;
  } ): Promise<Set<string>> {
    const rows = await searchAliasFromRouter( {
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      verifyTls: config.verifyTls,
    } );

    const blockedAlias = rows.find( ( row ) => row.name === "Blocked_Devices" );
    return parseBlockedAddresses( blockedAlias?.content );
  }

  async getDnsSearchQueries( input: {
    apiBaseUrl: string;
    apiKey: string;
    apiSecret: string;
    verifyTls: boolean;
    clientIp: string;
    current?: number;
    rowCount?: number;
    action?: string;
  } ): Promise<NetworkDnsQueryResult> {
    return searchDnsQueriesFromRouter( input );
  }
}

export const networkDeviceService = new NetworkDeviceService();
