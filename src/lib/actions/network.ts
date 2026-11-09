"use server";

import { z } from "zod";

import {
  errorMessage,
  getActor,
  getRequesterIp,
  NOT_CONFIGURED,
  requireManager,
} from "@/lib/network/action-helpers";
import { db } from "@/lib/db";
import { describeReason } from "@/lib/network/access-policy";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { loadAccessDecisions, reconcileAccess } from "@/lib/network/enforcement";
import { networkAuditService } from "@/lib/services/network-audit.service";
import {
  networkDeviceService,
  networkSettingsService,
  networkTrafficService,
} from "@/lib/services";
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

/**
 * Adds isBlocked (and, in MAC control mode, the access decision with its
 * reasons). MAC mode reads desired state from the database; legacy IP mode
 * reads the Blocked_Devices table on the router.
 */
async function decorateDevices<T extends DeviceRow>( userId: string, devices: T[] ) {
  const { settings, decisions } = await loadAccessDecisions( userId );
  if ( settings?.controlMode === "mac" ) {
    return {
      devices: devices.map( ( device ) => {
        const access = decisions.get( device.id );
        return { ...device, isBlocked: access?.blocked ?? false, access };
      } ),
      warning: undefined as string | undefined,
    };
  }
  const { blocked, warning } = await readBlockedAddresses( userId );
  return { devices: withBlockState( devices, blocked ), warning };
}

export async function getNetworkDevices( search?: string ) {
  try {
    const { userId, canManage } = await getActor();
    const listed = await networkDeviceService.list( userId, search );
    const { devices, warning } = await decorateDevices( userId, listed );

    return { success: true, canManage, warning, devices };
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

    const { devices } = await decorateDevices( userId, await networkDeviceService.list( userId ) );
    const decorated = devices.find( ( row ) => row.id === device.id );

    return {
      success: true,
      canManage,
      device: {
        ...device,
        isBlocked: decorated?.isBlocked ?? false,
        access: "access" in ( decorated ?? {} ) ? ( decorated as { access?: unknown } ).access : undefined,
      },
    };
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
    const { userId, email } = await requireManager();
    const connection = await networkSettingsService.getConnection( userId );
    if ( !connection ) return { success: false, error: NOT_CONFIGURED };

    await networkAuditService.record( {
      userId,
      actorEmail: email,
      action: "scan",
      success: true,
      details: { subnet: subnet || connection.defaultSubnet || null },
    } );
    const result = await networkDeviceService.scanAndSave( userId, {
      ...connection,
      subnet: subnet || connection.defaultSubnet || undefined,
    } );
    // New addresses of blocked devices must be enforced right away.
    await reconcileAccess( userId, { trigger: "scan" } ).catch( ( error ) =>
      console.error( "reconcile after scan failed", error ),
    );
    const { devices } = await decorateDevices( userId, result.devices );

    return {
      success: true,
      devices,
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
    const { userId, email } = await requireManager();
    const { id, ...input } = updateNetworkDeviceSchema.parse( values );
    const device = await networkAuditService.track(
      { userId, actorEmail: email, action: "edit", deviceId: id, details: input },
      () => networkDeviceService.update( userId, id, input ),
    );
    return { success: true, device };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to update device" ) };
  }
}

export async function deleteNetworkDevice( id: string ) {
  try {
    const { userId, email } = await requireManager();
    await networkAuditService.track(
      { userId, actorEmail: email, action: "delete", deviceId: id },
      () => networkDeviceService.delete( userId, id ),
    );
    return { success: true };
  } catch ( error ) {
    return { success: false, error: errorMessage( error, "Failed to delete device" ) };
  }
}

export async function reviewNetworkDevice( id: string ) {
  try {
    const { userId, email } = await requireManager();
    const device = await networkAuditService.track(
      { userId, actorEmail: email, action: "review", deviceId: id },
      () => networkDeviceService.markReviewed( userId, id ),
    );
    // Reviewing releases a quarantined device.
    await reconcileAccess( userId, { actorEmail: email, trigger: "review" } ).catch( ( error ) =>
      console.error( "reconcile after review failed", error ),
    );
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

    const { email } = await getActor();
    const settings = await db.networkIntegrationSettings.findUnique( { where: { userId } } );
    const device = await networkDeviceService.getById( userId, parsed.id );
    if ( !device ) return { success: false, error: "Device not found" };
    const audit = {
      userId,
      actorEmail: email,
      action: parsed.isBlocked ? "block" : "unblock",
      target: getDeviceDisplayName( device ),
      deviceId: device.id,
    };

    let notice: string | undefined;
    if ( settings?.controlMode === "mac" ) {
      // MAC mode: record desired state, then let the reconciler apply it.
      const { decisions } = await loadAccessDecisions( userId );
      const exempt = decisions.get( device.id )?.exempt;
      if ( parsed.isBlocked && exempt ) return { success: false, error: exempt };

      await networkAuditService.track( { ...audit, details: { mode: "mac", mac: device.macAddress } }, async () => {
        await db.networkDevice.update( {
          where: { id: device.id },
          data: parsed.isBlocked ? { blocked: true } : { blocked: false, pausedUntil: null },
        } );
        const result = await reconcileAccess( userId, { actorEmail: email, trigger: audit.action } );
        if ( result?.errors.length ) throw new Error( result.errors.join( "; " ) );
      } );

      if ( !parsed.isBlocked ) {
        const still = ( await loadAccessDecisions( userId ) ).decisions.get( device.id );
        if ( still?.blocked ) {
          notice = `Still blocked: ${still.reasons.map( describeReason ).join( ", " )}`;
        }
      }
    } else {
      await networkAuditService.track( { ...audit, details: { mode: "ip", ip: device.ipAddress } }, () =>
        networkDeviceService.setBlockedState( userId, parsed.id, connection, parsed.isBlocked ),
      );
    }

    const { devices } = await decorateDevices( userId, await networkDeviceService.list( userId ) );
    return { success: true, devices, notice };
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
