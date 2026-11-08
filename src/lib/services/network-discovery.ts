import type { NetworkDeviceRole } from "@/app/generated/prisma";
import type { ObservedAddress } from "@/lib/db/repositories/network-device.repository";
import { opnsenseRequest, type OpnsenseConnection } from "@/lib/services/opnsense-client";

/**
 * Builds one observation per MAC address from the router's neighbour tables
 * (ARP for IPv4, NDP for IPv6), DHCP leases and interface/gateway config.
 */

export interface DeviceObservation {
  macAddress: string;
  ipAddress?: string; // current IPv4
  hostname?: string;
  dhcpHostname?: string;
  vendor?: string;
  intf?: string;
  intfDescription?: string;
  role: NetworkDeviceRole;
  isUpstream: boolean;
  isRandomMac: boolean;
  isOnline: boolean;
  addresses: ObservedAddress[];
}

export interface DiscoveryResult {
  observations: DeviceObservation[];
  sources: { arp: number; ndp: number; leases: number; gateways: number };
}

type Row = Record<string, unknown>;

function str( value: unknown ): string | undefined {
  if ( typeof value !== "string" ) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function rowsOf( payload: unknown ): Row[] {
  if ( typeof payload !== "object" || payload === null ) return [];
  const root = payload as Row;
  const rows = root.rows ?? root.items;
  return Array.isArray( rows )
    ? rows.filter( ( row ): row is Row => typeof row === "object" && row !== null )
    : [];
}

export function normaliseMac( value: unknown ): string | undefined {
  const raw = str( value )?.toLowerCase().replace( /-/g, ":" );
  return raw && /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test( raw ) ? raw : undefined;
}

/** Locally administered bit set: a privacy/randomised MAC. */
export function isRandomMac( mac: string ): boolean {
  return ( parseInt( mac.slice( 0, 2 ), 16 ) & 0x02 ) !== 0;
}

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

/** IPv4 CIDR match; true when no (or an unparseable) subnet is given. */
export function isInSubnet( ip: string, subnet?: string ): boolean {
  if ( !subnet ) return true;
  const [ base, prefixRaw ] = subnet.trim().split( "/" );
  const baseInt = ipv4ToInt( base );
  const ipInt = ipv4ToInt( ip );
  if ( baseInt === null ) return true;
  if ( ipInt === null ) return false;
  const prefix = prefixRaw === undefined ? 32 : Number( prefixRaw );
  if ( !Number.isInteger( prefix ) || prefix < 0 || prefix > 32 ) return true;
  const size = 2 ** ( 32 - prefix );
  return Math.floor( ipInt / size ) === Math.floor( baseInt / size );
}

// The router runs one DHCP server; query all three backends and merge
// whatever answers (unused ones return empty result sets).
const LEASE_ENDPOINTS = [
  "dnsmasq/leases/search",
  "kea/leases4/search",
  "dhcpv4/leases/search_lease",
];

async function fetchRows( connection: OpnsenseConnection, path: string, body?: Row ) {
  return rowsOf(
    await opnsenseRequest( connection, path, body ? { body } : { method: "GET" } ),
  );
}

export async function discoverDevices(
  connection: OpnsenseConnection,
): Promise<DiscoveryResult> {
  const search = { current: 1, rowCount: 2000, sort: {} };

  // ARP is required; everything else degrades gracefully.
  const [ arp, optional ] = await Promise.all( [
    fetchRows( connection, "diagnostics/interface/search_arp", { ...search, resolve: "no" } ),
    Promise.allSettled( [
      fetchRows( connection, "diagnostics/interface/search_ndp", search ),
      fetchRows( connection, "routes/gateway/status" ),
      fetchRows( connection, "interfaces/overview/interfaces_info" ),
      ...LEASE_ENDPOINTS.map( ( path ) => fetchRows( connection, path, search ) ),
    ] ),
  ] );

  const settled = ( index: number ) => {
    const result = optional[ index ];
    return result.status === "fulfilled" ? result.value : [];
  };
  const ndp = settled( 0 );
  const gateways = settled( 1 );
  const interfaces = settled( 2 );
  const leases = LEASE_ENDPOINTS.flatMap( ( _, index ) => settled( 3 + index ) );

  const gatewayIps = new Set(
    gateways.map( ( row ) => str( row.address ) ).filter( ( ip ): ip is string => !!ip ),
  );
  const routerMacs = new Set<string>();
  const upstreamDevices = new Set<string>();
  for ( const row of interfaces ) {
    const mac = normaliseMac( row.macaddr );
    if ( mac ) routerMacs.add( mac );
    const config = ( row.config ?? {} ) as Row;
    const device = str( row.device );
    if ( device && ( str( config.gateway ) || str( config.identifier ) === "wan" ) ) {
      upstreamDevices.add( device );
    }
  }

  const byMac = new Map<string, DeviceObservation & { permanent: boolean }>();
  const observe = ( mac: string ) => {
    let entry = byMac.get( mac );
    if ( !entry ) {
      entry = {
        macAddress: mac,
        role: "CLIENT",
        isUpstream: false,
        isRandomMac: isRandomMac( mac ),
        isOnline: false,
        addresses: [],
        permanent: false,
      };
      byMac.set( mac, entry );
    }
    return entry;
  };
  const addAddress = ( entry: DeviceObservation, address: ObservedAddress ) => {
    if ( !entry.addresses.some( ( existing ) => existing.ip === address.ip ) ) {
      entry.addresses.push( address );
    }
  };

  for ( const row of arp ) {
    const mac = normaliseMac( row.mac );
    const ip = str( row.ip );
    if ( !mac || !ip ) continue; // incomplete ARP entries have no MAC
    const entry = observe( mac );
    const permanent = row.permanent === true;
    // Prefer a regular entry over the router's own (permanent) addresses.
    if ( !entry.ipAddress || ( entry.permanent && !permanent ) ) {
      entry.ipAddress = ip;
      entry.intf = str( row.intf );
      entry.intfDescription = str( row.intf_description );
    }
    entry.permanent ||= permanent;
    entry.isOnline ||= row.expired !== true;
    entry.vendor ??= str( row.manufacturer );
    entry.hostname ??= str( row.hostname );
    addAddress( entry, { ip, family: "ip4", source: "arp", intf: str( row.intf ) } );
  }

  for ( const row of leases ) {
    const mac = normaliseMac( row.hwaddr ?? row.mac );
    const ip = str( row.address );
    if ( !mac ) continue;
    const entry = observe( mac );
    // Dnsmasq reports "*" when the client sent no hostname.
    const leaseHostname = str( row.hostname );
    if ( leaseHostname && leaseHostname !== "*" ) entry.dhcpHostname ??= leaseHostname;
    entry.vendor ??= str( row.mac_info ) ?? str( row.man );
    if ( ip && !ip.includes( ":" ) ) {
      if ( !entry.ipAddress ) {
        // Lease without an ARP entry: known device, currently not seen.
        entry.ipAddress = ip;
        entry.intf = str( row.if );
        entry.intfDescription = str( row.if_descr );
      }
      addAddress( entry, { ip, family: "ip4", source: "dhcp", intf: str( row.if ) } );
    }
  }

  for ( const row of ndp ) {
    const mac = normaliseMac( row.mac );
    const ip = str( row.ip );
    if ( !mac || !ip ) continue;
    const entry = byMac.get( mac );
    if ( !entry ) continue; // IPv6-only neighbours have no IPv4 identity yet
    entry.isOnline = true;
    entry.vendor ??= str( row.manufacturer );
    addAddress( entry, { ip, family: "ip6", source: "ndp", intf: str( row.intf ) } );
  }

  const observations: DeviceObservation[] = [];
  for ( const { permanent, ...entry } of byMac.values() ) {
    if ( !entry.ipAddress ) continue;
    const isInfrastructure =
      permanent ||
      routerMacs.has( entry.macAddress ) ||
      entry.addresses.some( ( address ) => gatewayIps.has( address.ip ) );
    observations.push( {
      ...entry,
      role: isInfrastructure ? "INFRASTRUCTURE" : "CLIENT",
      isUpstream: !!entry.intf && upstreamDevices.has( entry.intf ),
    } );
  }

  return {
    observations,
    sources: {
      arp: arp.length,
      ndp: ndp.length,
      leases: leases.length,
      gateways: gatewayIps.size,
    },
  };
}
