import { networkDeviceRepository } from "@/lib/db/repositories";
import {
  OpnsenseApiError,
  opnsenseRequest,
  type OpnsenseConnection,
} from "@/lib/services/opnsense-client";
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

/** Exact-match IPv4 CIDR test; returns true for non-IPv4 input or no subnet. */
function ipv4ToInt( ip: string ): number | null {
  const parts = ip.split( "." );
  if ( parts.length !== 4 ) return null;
  let value = 0;
  for ( const part of parts ) {
    if ( !/^\d{1,3}$/.test( part ) ) return null;
    const octet = Number( part );
    if ( octet > 255 ) return null;
    value = value * 256 + octet;
  }
  return value;
}

export function isInSubnet( ip: string, subnet?: string ): boolean {
  if ( !subnet ) return true;
  const [ base, prefixRaw ] = subnet.trim().split( "/" );
  const baseInt = ipv4ToInt( base );
  const ipInt = ipv4ToInt( ip );
  if ( baseInt === null ) return true; // unparseable subnet: don't drop devices
  if ( ipInt === null ) return false; // IPv6 entry while filtering an IPv4 subnet
  const prefix = prefixRaw === undefined ? 32 : Number( prefixRaw );
  if ( !Number.isInteger( prefix ) || prefix < 0 || prefix > 32 ) return true;
  const size = 2 ** ( 32 - prefix );
  return Math.floor( ipInt / size ) === Math.floor( baseInt / size );
}

async function discoverFromRouterApi(
  connection: OpnsenseConnection,
  subnet?: string,
): Promise<DiscoveredDevice[]> {
  // search_arp has no subnet parameter, so the subnet is applied locally.
  const payload = await opnsenseRequest( connection, "diagnostics/interface/search_arp", {
    body: { current: 1, rowCount: 1000, sort: {}, resolve: "no" },
  } );
  return mapDiscoveredDevices( payload ).filter( ( device ) =>
    isInSubnet( device.ipAddress, subnet ),
  );
}

export const BLOCKED_DEVICES_ALIAS = "Blocked_Devices";

async function setBlockedStateOnRouter(
  connection: OpnsenseConnection,
  ipAddress: string,
  isBlocked: boolean,
): Promise<void> {
  // For a "host" alias OPNsense persists this to config.xml and updates the
  // live pf table; for an "external" alias it only updates the pf table.
  const action = isBlocked ? "add" : "delete";
  const result = await opnsenseRequest<{ status?: string; status_msg?: string }>(
    connection,
    `firewall/alias_util/${action}/${BLOCKED_DEVICES_ALIAS}`,
    { body: { address: ipAddress } },
  );

  if ( result?.status && result.status !== "done" ) {
    throw new OpnsenseApiError(
      result.status_msg || `Router refused to ${action} ${ipAddress}`,
    );
  }
}

function collectAddresses( value: unknown, into: Set<string> ) {
  if ( typeof value === "string" ) {
    for ( const item of value.split( /[\n,;\s]+/ ) ) {
      const trimmed = item.trim();
      if ( trimmed ) into.add( trimmed );
    }
    return;
  }
  if ( Array.isArray( value ) ) {
    for ( const item of value ) collectAddresses( item, into );
    return;
  }
  if ( typeof value === "object" && value !== null ) {
    const row = value as Record<string, unknown>;
    collectAddresses( row.ip ?? row.address ?? row.item, into );
  }
}

/** Addresses currently in the live pf table, i.e. what the firewall enforces. */
async function listBlockedFromPfTable( connection: OpnsenseConnection ) {
  const payload = await opnsenseRequest<{ rows?: unknown }>(
    connection,
    `firewall/alias_util/list/${BLOCKED_DEVICES_ALIAS}`,
    { body: { current: 1, rowCount: 1000 } },
  );
  const addresses = new Set<string>();
  collectAddresses( payload?.rows, addresses );
  return addresses;
}

/** Addresses saved in the alias definition (config.xml), host-type aliases only. */
async function listBlockedFromAliasConfig( connection: OpnsenseConnection ) {
  const payload = await opnsenseRequest<{ rows?: AliasSearchRow[] }>(
    connection,
    "firewall/alias/search_item",
    {
      body: { current: 1, rowCount: 50, sort: {}, searchPhrase: BLOCKED_DEVICES_ALIAS },
    },
  );
  const alias = ( payload?.rows ?? [] ).find(
    ( row ) => row?.name === BLOCKED_DEVICES_ALIAS,
  );
  const addresses = new Set<string>();
  collectAddresses( alias?.content, addresses );
  return addresses;
}

const DNS_LOG_FETCH_LIMIT = 1000;

async function searchDnsQueriesFromRouter(
  connection: OpnsenseConnection,
  input: {
    clientIp: string;
    current?: number;
    rowCount?: number;
    action?: string;
  },
): Promise<DnsSearchQueriesPayload> {
  // Unbound's search_queries ignores `client` unless a time range is also given,
  // and has no `action` filter, so it used to return every client's queries.
  // Narrow the router-side result with searchPhrase, then filter exactly here.
  const payload = await opnsenseRequest( connection, "unbound/overview/search_queries", {
    body: {
      current: 1,
      rowCount: DNS_LOG_FETCH_LIMIT,
      sort: {},
      searchPhrase: input.clientIp,
    },
  } );

  const matching = mapDnsSearchQueries( payload ).rows.filter(
    ( row ) =>
      row.client === input.clientIp &&
      ( !input.action || row.action === input.action ),
  );

  const current = Math.max( 1, input.current ?? 1 );
  const rowCount = Math.max( 1, input.rowCount ?? 50 );
  const rows = matching.slice( ( current - 1 ) * rowCount, current * rowCount );

  return { total: matching.length, rowCount: rows.length, current, rows };
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

    const discovered = await discoverFromRouterApi( config, config.subnet );

    const now = new Date();

    await Promise.all(
      discovered.map( ( device ) =>
        networkDeviceRepository.upsertByUserAndIp( userId, device.ipAddress, {
          hostname: device.hostname,
          macAddress: device.macAddress,
          vendor: device.vendor,
          // deviceType is user-owned; ARP's `type` is the link type ("ethernet").
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

    await setBlockedStateOnRouter( config, device.ipAddress, isBlocked );
  }

  async getBlockedAddresses( config: {
    apiBaseUrl: string;
    apiKey: string;
    apiSecret: string;
    verifyTls: boolean;
  } ): Promise<Set<string>> {
    try {
      return await listBlockedFromPfTable( config );
    } catch ( error ) {
      // Older firmware or a missing table: fall back to the saved alias content.
      if ( error instanceof OpnsenseApiError && error.status !== undefined ) {
        return listBlockedFromAliasConfig( config );
      }
      throw error;
    }
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
    const { clientIp, current, rowCount, action, ...connection } = input;
    return searchDnsQueriesFromRouter( connection, { clientIp, current, rowCount, action } );
  }
}

export const networkDeviceService = new NetworkDeviceService();
