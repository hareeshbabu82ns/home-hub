"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { getUserAuth } from "@/lib/auth/utils";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import {
  networkDeviceService,
  networkSettingsService,
  networkTrafficService,
} from "@/lib/services";
import { NetworkSafetyError } from "@/lib/services/network-device.service";
import { OpnsenseApiError } from "@/lib/services/opnsense-client";
import type {
  NetworkDnsQueryResult,
  NetworkTrafficSnapshot,
} from "@/types/network";

const networkSettingsSchema = z.object( {
  apiBaseUrl: z.string().url( "Valid API base URL is required" ),
  // Blank keeps the stored value.
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  defaultSubnet: z.string().optional(),
  verifyTls: z.boolean().optional(),
} );

const updateNetworkDeviceSchema = z.object( {
  id: z.string().min( 1 ),
  name: z.string().max( 80 ).optional(),
  hostname: z.string().max( 120 ).optional(),
  vendor: z.string().max( 80 ).optional(),
  deviceType: z.string().max( 80 ).optional(),
  notes: z.string().max( 500 ).optional(),
  isNew: z.boolean().optional(),
} );

const toggleNetworkDeviceBlockSchema = z.object( {
  id: z.string().min( 1 ),
  isBlocked: z.boolean(),
  // Required to block the device the request is coming from.
  confirmSelf: z.boolean().optional(),
} );

const networkDnsQuerySearchSchema = z.object( {
  id: z.string().min( 1 ),
  current: z.number().int().positive().optional(),
  rowCount: z.number().int().positive().max( 500 ).optional(),
  action: z.string().min( 1 ).max( 30 ).optional(),
} );

const NOT_CONFIGURED = "Configure network API credentials in Settings first";

class NetworkPermissionError extends Error {}

async function getActor() {
  const { session } = await getUserAuth();
  if ( !session ) {
    throw new NetworkPermissionError( "Unauthorized" );
  }
  return {
    userId: session.user.id,
    canManage: session.user.role === "ADMIN",
  };
}

/** Network control (scan, block, edit, settings) is limited to admins. */
async function requireManager() {
  const actor = await getActor();
  if ( !actor.canManage ) {
    throw new NetworkPermissionError( "Only admins can change network settings or devices" );
  }
  return actor;
}

function errorMessage( error: unknown, fallback: string ): string {
  if ( error instanceof z.ZodError ) {
    return error.issues[ 0 ]?.message || "Invalid input";
  }
  if (
    error instanceof NetworkPermissionError ||
    error instanceof NetworkSafetyError ||
    error instanceof OpnsenseApiError
  ) {
    return error.message;
  }
  if ( error instanceof Error && /decrypt|NETWORK_SECRET_KEY/.test( error.message ) ) {
    return error.message;
  }
  console.error( fallback, error );
  return fallback;
}

async function getRequesterIp(): Promise<string | null> {
  const headerList = await headers();
  const forwarded = headerList.get( "x-forwarded-for" )?.split( "," )[ 0 ]?.trim();
  const ip = forwarded || headerList.get( "x-real-ip" )?.trim() || null;
  return ip?.replace( /^::ffff:/, "" ) ?? null;
}

type DeviceRow = Awaited<ReturnType<typeof networkDeviceService.list>>[number];

/**
 * Blocking is per IP. Only the device currently holding an IP (online, else
 * most recently seen) is shown as blocked; stale records with the same
 * last-known IP are not.
 */
function withBlockState<T extends DeviceRow>( devices: T[], blocked: Set<string> ) {
  const holder = new Map<string, T>();
  for ( const device of devices ) {
    const current = holder.get( device.ipAddress );
    if (
      !current ||
      ( device.isOnline && !current.isOnline ) ||
      ( device.isOnline === current.isOnline &&
        new Date( device.lastSeenAt ) > new Date( current.lastSeenAt ) )
    ) {
      holder.set( device.ipAddress, device );
    }
  }
  return devices.map( ( device ) => ( {
    ...device,
    isBlocked:
      blocked.has( device.ipAddress ) && holder.get( device.ipAddress )?.id === device.id,
  } ) );
}

async function readBlockedAddresses( userId: string ) {
  const connection = await networkSettingsService.getConnection( userId );
  if ( !connection ) return { blocked: new Set<string>() };
  try {
    return { blocked: await networkDeviceService.getBlockedAddresses( connection ) };
  } catch ( error ) {
    console.error( "Failed to read blocked devices from router", error );
    // The inventory lives in the database; a router outage shouldn't hide it.
    return {
      blocked: new Set<string>(),
      warning: "Router unreachable: block status may be out of date",
    };
  }
}

export async function getNetworkDevices( search?: string ) {
  try {
    const { userId, canManage } = await getActor();
    const [ devices, { blocked, warning } ] = await Promise.all( [
      networkDeviceService.list( userId, search ),
      readBlockedAddresses( userId ),
    ] );

    return {
      success: true,
      canManage,
      warning,
      devices: withBlockState( devices, blocked ),
    };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to load devices" ) };
  }
}

export async function getNetworkDeviceDetails( id: string ) {
  try {
    const { userId, canManage } = await getActor();
    const device = await networkDeviceService.getById( userId, id );
    if ( !device ) {
      return { success: false, error: "Device not found" };
    }

    const [ devices, { blocked } ] = await Promise.all( [
      networkDeviceService.list( userId ),
      readBlockedAddresses( userId ),
    ] );
    const isBlocked =
      withBlockState( devices, blocked ).find( ( row ) => row.id === device.id )?.isBlocked ??
      false;

    return { success: true, canManage, device: { ...device, isBlocked } };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to load device details" ) };
  }
}

export async function getNetworkDeviceDnsQueries(
  values: z.infer<typeof networkDnsQuerySearchSchema>,
): Promise<{ success: boolean; data?: NetworkDnsQueryResult; error?: string }> {
  try {
    const { userId } = await getActor();
    const parsed = networkDnsQuerySearchSchema.parse( values );

    const [ device, connection ] = await Promise.all( [
      networkDeviceService.getById( userId, parsed.id ),
      networkSettingsService.getConnection( userId ),
    ] );

    if ( !device ) return { success: false, error: "Device not found" };
    if ( !connection ) return { success: false, error: NOT_CONFIGURED };

    const data = await networkDeviceService.getDnsSearchQueries( {
      ...connection,
      clientIp: device.ipAddress,
      current: parsed.current,
      rowCount: parsed.rowCount,
      action: parsed.action,
    } );

    return { success: true, data };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to load DNS queries" ) };
  }
}

export async function scanNetworkDevices( subnet?: string ) {
  try {
    const { userId } = await requireManager();
    const connection = await networkSettingsService.getConnection( userId );
    if ( !connection ) return { success: false, error: NOT_CONFIGURED };

    const result = await networkDeviceService.scanAndSave( userId, {
      ...connection,
      subnet: subnet || connection.defaultSubnet || undefined,
    } );
    const { blocked } = await readBlockedAddresses( userId );

    return {
      success: true,
      devices: withBlockState( result.devices, blocked ),
      scannedCount: result.scannedCount,
      newCount: result.newCount,
      blocksMoved: result.blocksMoved,
      sources: result.sources,
    };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to scan network" ) };
  }
}

export async function updateNetworkDevice(
  values: z.infer<typeof updateNetworkDeviceSchema>,
) {
  try {
    const { userId } = await requireManager();
    const { id, ...input } = updateNetworkDeviceSchema.parse( values );
    const device = await networkDeviceService.update( userId, id, input );
    return { success: true, device };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to update device" ) };
  }
}

export async function deleteNetworkDevice( id: string ) {
  try {
    const { userId } = await requireManager();
    await networkDeviceService.delete( userId, id );
    return { success: true };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to delete device" ) };
  }
}

export async function reviewNetworkDevice( id: string ) {
  try {
    const { userId } = await requireManager();
    const device = await networkDeviceService.markReviewed( userId, id );
    return { success: true, device };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to update device" ) };
  }
}

export async function toggleNetworkDeviceBlocked(
  values: z.infer<typeof toggleNetworkDeviceBlockSchema>,
) {
  try {
    const { userId } = await requireManager();
    const parsed = toggleNetworkDeviceBlockSchema.parse( values );
    const connection = await networkSettingsService.getConnection( userId );
    if ( !connection ) return { success: false, error: NOT_CONFIGURED };

    if ( parsed.isBlocked && !parsed.confirmSelf ) {
      const device = await networkDeviceService.getById( userId, parsed.id );
      const requesterIp = await getRequesterIp();
      if ( device && requesterIp && device.ipAddress === requesterIp ) {
        return {
          success: false,
          requiresConfirmation: true,
          error: "This looks like the device you're using right now. Blocking it will cut off your access.",
        };
      }
    }

    await networkDeviceService.setBlockedState( userId, parsed.id, connection, parsed.isBlocked );

    const [ devices, { blocked } ] = await Promise.all( [
      networkDeviceService.list( userId ),
      readBlockedAddresses( userId ),
    ] );
    return { success: true, devices: withBlockState( devices, blocked ) };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to update block status" ) };
  }
}

export async function getNetworkSettings() {
  try {
    const { userId, canManage } = await getActor();
    const settings = await networkSettingsService.getSummary( userId );
    return { success: true, canManage, settings };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to load network settings" ) };
  }
}

export async function saveNetworkSettings(
  values: z.infer<typeof networkSettingsSchema>,
) {
  try {
    const { userId } = await requireManager();
    const parsed = networkSettingsSchema.parse( values );
    const settings = await networkSettingsService.save( userId, {
      apiBaseUrl: parsed.apiBaseUrl,
      apiKey: parsed.apiKey,
      apiSecret: parsed.apiSecret,
      defaultSubnet: parsed.defaultSubnet?.trim() || undefined,
      verifyTls: parsed.verifyTls ?? false,
    } );
    return { success: true, settings };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to save network settings" ) };
  }
}

export async function getNetworkTrafficTopLan(): Promise<{
  success: boolean;
  data?: NetworkTrafficSnapshot;
  error?: string;
}> {
  try {
    const { userId } = await getActor();
    const connection = await networkSettingsService.getConnection( userId );
    if ( !connection ) return { success: false, error: NOT_CONFIGURED };

    const [ trafficRecords, devices ] = await Promise.all( [
      networkTrafficService.getTopLan( connection ),
      networkDeviceService.list( userId ),
    ] );

    // Prefer the device currently holding each IP.
    const nameByIp = new Map<string, string>();
    for ( const device of [ ...devices ].sort( ( a, b ) => Number( a.isOnline ) - Number( b.isOnline ) ) ) {
      nameByIp.set( device.ipAddress, getDeviceDisplayName( device ) );
    }

    const records = trafficRecords.map( ( record ) => {
      const savedName = nameByIp.get( record.address );
      return {
        ...record,
        rname: savedName || record.rname,
        displayName: savedName || record.rname || record.address,
      };
    } );

    return {
      success: true,
      data: { records, fetchedAt: new Date().toISOString() },
    };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to load network traffic" ) };
  }
}
