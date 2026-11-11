import { networkDeviceRepository } from "@/lib/db/repositories";
import {
  OpnsenseApiError,
  opnsenseRequest,
  type OpnsenseConnection,
} from "@/lib/services/opnsense-client";
import { discoverDevices, isInSubnet } from "@/lib/services/network-discovery";
import type { NetworkDnsQueryResult, NetworkDnsQueryRow } from "@/types/network";

interface ScanResult {
  devices: Awaited<ReturnType<typeof networkDeviceRepository.findManyByUser>>;
  scannedCount: number;
  newCount: number;
  blocksMoved: number;
  sources: { arp: number; ndp: number; leases: number; gateways: number };
}

interface NetworkDeviceUpdateInput {
  name?: string;
  hostname?: string;
  vendor?: string;
  deviceType?: string;
  notes?: string;
  isNew?: boolean;
  isFavorite?: boolean;
}

interface AliasSearchRow {
  name?: string;
  content?: string;
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

const OFFLINE_GRACE_MS = 5 * 60 * 1000;

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

/** A control action refused to protect the network; message is user-facing. */
export class NetworkSafetyError extends Error {
  constructor( message: string ) {
    super( message );
    this.name = "NetworkSafetyError";
  }
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
    config: OpnsenseConnection & { subnet?: string },
  ): Promise<ScanResult> {
    const { subnet, ...connection } = config;
    const [ existing, discovery, blockedIps ] = await Promise.all( [
      networkDeviceRepository.findManyByUser( { userId } ),
      discoverDevices( connection ),
      this.getBlockedAddresses( connection ).catch( () => null ),
    ] );

    const observations = discovery.observations.filter( ( observation ) =>
      isInSubnet( observation.ipAddress!, subnet ),
    );
    const existingByMac = new Map( existing.map( ( device ) => [ device.macAddress, device ] ) );
    const now = new Date();

    const seenIds = new Set<string>();
    for ( const observation of observations ) {
      const device = await networkDeviceRepository.upsertObserved(
        userId,
        observation.macAddress,
        {
          ipAddress: observation.ipAddress!,
          hostname: observation.hostname,
          dhcpHostname: observation.dhcpHostname,
          vendor: observation.vendor,
          intf: observation.intf,
          intfDescription: observation.intfDescription,
          role: observation.role,
          isUpstream: observation.isUpstream,
          isRandomMac: observation.isRandomMac,
          isOnline: observation.isOnline,
          seenAt: now,
        },
      );
      if ( observation.isOnline ) seenIds.add( device.id );
      await networkDeviceRepository.recordAddresses( device.id, observation.addresses, now );
    }

    // A device briefly missing from ARP isn't offline; wait out a grace period.
    await networkDeviceRepository.markOffline(
      userId,
      existing
        .filter( ( device ) => !seenIds.has( device.id ) && isInSubnet( device.ipAddress, subnet ) )
        .map( ( device ) => device.id ),
      new Date( now.getTime() - OFFLINE_GRACE_MS ),
    );

    const blocksMoved = blockedIps
      ? await this.moveBlocksWithDevices( connection, blockedIps, existingByMac, observations )
      : 0;

    const devices = await networkDeviceRepository.findManyByUser( { userId } );
    return {
      devices,
      scannedCount: observations.length,
      newCount: devices.filter( ( device ) => device.isNew ).length,
      blocksMoved,
      sources: discovery.sources,
    };
  }

  /**
   * Blocking is still by IP (Blocked_Devices alias). When a blocked device
   * gets a new address, block the new one and release the old one, so the
   * block follows the device rather than whoever inherits its old IP.
   */
  private async moveBlocksWithDevices(
    connection: OpnsenseConnection,
    blockedIps: Set<string>,
    previousByMac: Map<string, { ipAddress: string }>,
    observations: { macAddress: string; ipAddress?: string }[],
  ): Promise<number> {
    const moves = observations
      .map( ( observation ) => ( {
        from: previousByMac.get( observation.macAddress )?.ipAddress,
        to: observation.ipAddress!,
      } ) )
      .filter( ( move ): move is { from: string; to: string } =>
        !!move.from && move.from !== move.to && blockedIps.has( move.from ),
      );
    if ( moves.length === 0 ) return 0;

    const keep = new Set( moves.map( ( move ) => move.to ) );
    for ( const move of moves ) {
      if ( !blockedIps.has( move.to ) ) {
        await setBlockedStateOnRouter( connection, move.to, true );
      }
    }
    for ( const move of moves ) {
      if ( !keep.has( move.from ) ) {
        await setBlockedStateOnRouter( connection, move.from, false );
      }
    }
    console.info( "[network] moved blocks with devices", moves );
    return moves.length;
  }

  async update( userId: string, id: string, input: NetworkDeviceUpdateInput ) {
    const device = await networkDeviceRepository.update( id, userId, input );
    if ( !device ) {
      throw new Error( "Device not found" );
    }
    return device;
  }

  async delete( userId: string, id: string ) {
    const device = await networkDeviceRepository.delete( id, userId );
    if ( !device ) {
      throw new Error( "Device not found" );
    }
    return device;
  }

  async markReviewed( userId: string, id: string ) {
    return this.update( userId, id, { isNew: false } );
  }

  async setBlockedState(
    userId: string,
    id: string,
    connection: OpnsenseConnection,
    isBlocked: boolean,
  ) {
    const device = await networkDeviceRepository.findById( id, userId );
    if ( !device ) {
      throw new Error( "Device not found" );
    }
    if ( isBlocked && device.role === "INFRASTRUCTURE" ) {
      throw new NetworkSafetyError( "Router and gateway addresses can't be blocked" );
    }
    if ( isBlocked && device.isUpstream ) {
      throw new NetworkSafetyError(
        "This device is on the WAN side; LAN firewall rules don't filter it",
      );
    }

    await setBlockedStateOnRouter( connection, device.ipAddress, isBlocked );
    return device;
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
