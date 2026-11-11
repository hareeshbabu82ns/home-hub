import { db } from "@/lib/db";
import type { NetworkDeviceRole } from "@/app/generated/prisma";

interface DeviceListFilters {
  userId: string;
  search?: string;
}

export interface ObservedDeviceData {
  ipAddress: string;
  hostname?: string;
  dhcpHostname?: string;
  vendor?: string;
  intf?: string;
  intfDescription?: string;
  role: NetworkDeviceRole;
  isUpstream: boolean;
  isRandomMac: boolean;
  isOnline: boolean;
  seenAt: Date;
}

export interface ObservedAddress {
  ip: string;
  family: "ip4" | "ip6";
  source: "arp" | "ndp" | "dhcp";
  intf?: string;
}

const ADDRESS_HISTORY_LIMIT = 25;

export const networkDeviceRepository = {
  findManyByUser: async ( { userId, search }: DeviceListFilters ) => {
    return db.networkDevice.findMany( {
      where: {
        userId,
        ...( search
          ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { hostname: { contains: search, mode: "insensitive" } },
              { dhcpHostname: { contains: search, mode: "insensitive" } },
              { vendor: { contains: search, mode: "insensitive" } },
              { ipAddress: { contains: search, mode: "insensitive" } },
              { macAddress: { contains: search, mode: "insensitive" } },
              { deviceType: { contains: search, mode: "insensitive" } },
            ],
          }
          : {} ),
      },
      orderBy: [ { isNew: "desc" }, { isOnline: "desc" }, { lastSeenAt: "desc" } ],
    } );
  },

  findById: async ( id: string, userId: string ) => {
    return db.networkDevice.findFirst( {
      where: { id, userId },
      include: {
        addresses: {
          orderBy: { lastSeenAt: "desc" },
          take: ADDRESS_HISTORY_LIMIT,
        },
      },
    } );
  },

  /** Upserts by (userId, MAC); never touches user-owned fields (name, deviceType, notes). */
  upsertObserved: async (
    userId: string,
    macAddress: string,
    data: ObservedDeviceData,
  ) => {
    const observed = {
      ipAddress: data.ipAddress,
      vendor: data.vendor,
      intf: data.intf,
      intfDescription: data.intfDescription,
      role: data.role,
      isUpstream: data.isUpstream,
      isRandomMac: data.isRandomMac,
      // Going offline is decided by markOffline (with a grace period), so an
      // observation only ever switches a device online.
      ...( data.isOnline ? { isOnline: true } : {} ),
      // Only overwrite names when the router actually reported one.
      ...( data.hostname ? { hostname: data.hostname } : {} ),
      ...( data.dhcpHostname ? { dhcpHostname: data.dhcpHostname } : {} ),
    };

    return db.networkDevice.upsert( {
      where: { userId_macAddress: { userId, macAddress } },
      create: {
        userId,
        macAddress,
        ...observed,
        // Infrastructure is expected; don't flag it for review.
        isNew: data.role !== "INFRASTRUCTURE",
        isOnline: data.isOnline,
        firstSeenAt: data.seenAt,
        lastSeenAt: data.seenAt,
      },
      update: {
        ...observed,
        ...( data.isOnline ? { lastSeenAt: data.seenAt } : {} ),
        ...( data.role === "INFRASTRUCTURE" ? { isNew: false } : {} ),
      },
    } );
  },

  recordAddresses: async (
    deviceId: string,
    addresses: ObservedAddress[],
    seenAt: Date,
  ) => {
    await Promise.all(
      addresses.map( ( address ) =>
        db.networkDeviceAddress.upsert( {
          where: { deviceId_ip: { deviceId, ip: address.ip } },
          create: {
            deviceId,
            ip: address.ip,
            family: address.family,
            source: address.source,
            intf: address.intf,
            firstSeenAt: seenAt,
            lastSeenAt: seenAt,
          },
          update: {
            source: address.source,
            intf: address.intf,
            lastSeenAt: seenAt,
          },
        } ),
      ),
    );
  },

  /** Marks devices offline unless they were seen after `seenBefore`. */
  markOffline: async ( userId: string, deviceIds: string[], seenBefore: Date ) => {
    if ( deviceIds.length === 0 ) return;
    await db.networkDevice.updateMany( {
      where: { userId, id: { in: deviceIds }, lastSeenAt: { lt: seenBefore } },
      data: { isOnline: false },
    } );
  },

  update: async (
    id: string,
    userId: string,
    data: {
      name?: string;
      hostname?: string;
      vendor?: string;
      deviceType?: string;
      notes?: string;
      isNew?: boolean;
      isFavorite?: boolean;
    },
  ) => {
    const { count } = await db.networkDevice.updateMany( {
      where: { id, userId },
      data,
    } );
    if ( count === 0 ) return null;
    return db.networkDevice.findFirst( { where: { id, userId } } );
  },

  delete: async ( id: string, userId: string ) => {
    // Address history is removed by the relation's onDelete: Cascade.
    const device = await db.networkDevice.findFirst( { where: { id, userId } } );
    if ( !device ) return null;
    return db.networkDevice.delete( { where: { id: device.id } } );
  },
};
