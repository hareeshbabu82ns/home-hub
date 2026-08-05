"use server";

import { z } from "zod";

import { getUserAuth } from "@/lib/auth/utils";
import {
  networkDeviceService,
  networkSettingsService,
  networkTrafficService,
} from "@/lib/services";
import type { NetworkTrafficSnapshot } from "@/types/network";

const networkSettingsSchema = z.object( {
  apiBaseUrl: z.string().url( "Valid API base URL is required" ),
  apiKey: z.string().min( 1, "API key is required" ),
  apiSecret: z.string().min( 1, "API secret is required" ),
  defaultSubnet: z.string().optional(),
  verifyTls: z.boolean().optional(),
} );

const updateNetworkDeviceSchema = z.object( {
  id: z.string().min( 1 ),
  name: z.string().max( 80 ).optional(),
  hostname: z.string().max( 120 ).optional(),
  macAddress: z.string().max( 50 ).optional(),
  vendor: z.string().max( 80 ).optional(),
  deviceType: z.string().max( 80 ).optional(),
  intf: z.string().max( 80 ).optional(),
  intfDescription: z.string().max( 160 ).optional(),
  notes: z.string().max( 500 ).optional(),
  isNew: z.boolean().optional(),
} );

const toggleNetworkDeviceBlockSchema = z.object( {
  id: z.string().min( 1 ),
  isBlocked: z.boolean(),
} );

async function getUserIdOrThrow() {
  const { session } = await getUserAuth();
  if ( !session ) {
    throw new Error( "Unauthorized" );
  }

  return session.user.id;
}

export async function getNetworkDevices( search?: string ) {
  try {
    const userId = await getUserIdOrThrow();
    const [ devices, settings ] = await Promise.all( [
      networkDeviceService.list( userId, search ),
      networkSettingsService.getByUserId( userId ),
    ] );

    if ( !settings ) {
      return {
        success: true,
        devices: devices.map( ( device ) => ( {
          ...device,
          isBlocked: false,
        } ) ),
      };
    }

    const blockedAddresses = await networkDeviceService.getBlockedAddresses( {
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      apiSecret: settings.apiSecret,
      verifyTls: settings.verifyTls,
    } );

    return {
      success: true,
      devices: devices.map( ( device ) => ( {
        ...device,
        isBlocked: blockedAddresses.has( device.ipAddress ),
      } ) ),
    };
  } catch {
    return { success: false, error: "Failed to load devices" };
  }
}

export async function scanNetworkDevices( subnet?: string ) {
  try {
    const userId = await getUserIdOrThrow();
    const settings = await networkSettingsService.getByUserId( userId );
    if ( !settings ) {
      return {
        success: false,
        error: "Configure network API credentials in Settings first",
      };
    }

    const result = await networkDeviceService.scanAndSave( userId, {
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      apiSecret: settings.apiSecret,
      verifyTls: settings.verifyTls,
      subnet: subnet || settings.defaultSubnet || undefined,
    } );

    const blockedAddresses = await networkDeviceService.getBlockedAddresses( {
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      apiSecret: settings.apiSecret,
      verifyTls: settings.verifyTls,
    } );

    return {
      success: true,
      devices: result.devices.map( ( device ) => ( {
        ...device,
        isBlocked: blockedAddresses.has( device.ipAddress ),
      } ) ),
      scannedCount: result.scannedCount,
      newCount: result.newCount,
    };
  } catch {
    return { success: false, error: "Failed to scan network" };
  }
}

export async function updateNetworkDevice(
  values: z.infer<typeof updateNetworkDeviceSchema>,
) {
  try {
    const userId = await getUserIdOrThrow();
    const parsed = updateNetworkDeviceSchema.parse( values );

    const { id, ...input } = parsed;
    const device = await networkDeviceService.update( userId, id, input );

    return { success: true, device };
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      return { success: false, error: error.issues[ 0 ]?.message || "Invalid input" };
    }

    return { success: false, error: "Failed to update device" };
  }
}

export async function deleteNetworkDevice( id: string ) {
  try {
    const userId = await getUserIdOrThrow();
    await networkDeviceService.delete( userId, id );
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete device" };
  }
}

export async function reviewNetworkDevice( id: string ) {
  try {
    const userId = await getUserIdOrThrow();
    const device = await networkDeviceService.markReviewed( userId, id );
    return { success: true, device };
  } catch {
    return { success: false, error: "Failed to update device" };
  }
}

export async function toggleNetworkDeviceBlocked(
  values: z.infer<typeof toggleNetworkDeviceBlockSchema>,
) {
  try {
    const userId = await getUserIdOrThrow();
    const parsed = toggleNetworkDeviceBlockSchema.parse( values );
    const settings = await networkSettingsService.getByUserId( userId );

    if ( !settings ) {
      return {
        success: false,
        error: "Configure network API credentials in Settings first",
      };
    }

    await networkDeviceService.setBlockedState(
      userId,
      parsed.id,
      {
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        verifyTls: settings.verifyTls,
      },
      parsed.isBlocked,
    );

    const [ devices, blockedAddresses ] = await Promise.all( [
      networkDeviceService.list( userId ),
      networkDeviceService.getBlockedAddresses( {
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        verifyTls: settings.verifyTls,
      } ),
    ] );

    return {
      success: true,
      devices: devices.map( ( device ) => ( {
        ...device,
        isBlocked: blockedAddresses.has( device.ipAddress ),
      } ) ),
    };
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      return {
        success: false,
        error: error.issues[ 0 ]?.message || "Invalid input",
      };
    }

    return {
      success: false,
      error: "Failed to update block status",
    };
  }
}

export async function getNetworkSettings() {
  try {
    const userId = await getUserIdOrThrow();
    const settings = await networkSettingsService.getByUserId( userId );

    if ( !settings ) {
      return {
        success: true,
        settings: null,
      };
    }

    return {
      success: true,
      settings: {
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        defaultSubnet: settings.defaultSubnet,
        verifyTls: settings.verifyTls,
        hasApiSecret: settings.apiSecret.length > 0,
      },
    };
  } catch {
    return { success: false, error: "Failed to load network settings" };
  }
}

export async function saveNetworkSettings(
  values: z.infer<typeof networkSettingsSchema>,
) {
  try {
    const userId = await getUserIdOrThrow();
    const parsed = networkSettingsSchema.parse( values );

    const existing = await networkSettingsService.getByUserId( userId );

    const saved = await networkSettingsService.saveByUserId( userId, {
      apiBaseUrl: parsed.apiBaseUrl,
      apiKey: parsed.apiKey,
      apiSecret:
        parsed.apiSecret === "********" && existing
          ? existing.apiSecret
          : parsed.apiSecret,
      defaultSubnet: parsed.defaultSubnet?.trim() || undefined,
      verifyTls: parsed.verifyTls ?? false,
    } );

    return {
      success: true,
      settings: {
        apiBaseUrl: saved.apiBaseUrl,
        apiKey: saved.apiKey,
        defaultSubnet: saved.defaultSubnet,
        verifyTls: saved.verifyTls,
        hasApiSecret: true,
      },
    };
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      return { success: false, error: error.issues[ 0 ]?.message || "Invalid input" };
    }

    return { success: false, error: "Failed to save network settings" };
  }
}

export async function getNetworkTrafficTopLan(): Promise<{
  success: boolean;
  data?: NetworkTrafficSnapshot;
  error?: string;
}> {
  try {
    const userId = await getUserIdOrThrow();
    const settings = await networkSettingsService.getByUserId( userId );

    if ( !settings ) {
      return {
        success: false,
        error: "Configure network API credentials in Settings first",
      };
    }

    const [ trafficRecords, devices ] = await Promise.all( [
      networkTrafficService.getTopLan( {
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        verifyTls: settings.verifyTls,
      } ),
      networkDeviceService.list( userId ),
    ] );

    const deviceNameByIp = new Map<string, string>();
    for ( const device of devices ) {
      const preferredName = device.name?.trim() || device.hostname?.trim() || "";
      if ( preferredName ) {
        deviceNameByIp.set( device.ipAddress, preferredName );
      }
    }

    const records = trafficRecords.map( ( record ) => {
      const savedName = deviceNameByIp.get( record.address );
      const displayName = savedName || record.rname || record.address;

      return {
        ...record,
        rname: savedName || record.rname,
        displayName,
      };
    } );

    return {
      success: true,
      data: {
        records,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      success: false,
      error: "Failed to load network traffic",
    };
  }
}
