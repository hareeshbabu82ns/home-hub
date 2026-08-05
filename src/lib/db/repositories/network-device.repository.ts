import { db } from "@/lib/db";

interface DeviceListFilters {
  userId: string;
  search?: string;
}

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
              { ipAddress: { contains: search, mode: "insensitive" } },
              { macAddress: { contains: search, mode: "insensitive" } },
              { deviceType: { contains: search, mode: "insensitive" } },
            ],
          }
          : {} ),
      },
      orderBy: [ { isNew: "desc" }, { lastSeenAt: "desc" } ],
    } );
  },

  findById: async ( id: string, userId: string ) => {
    return db.networkDevice.findFirst( {
      where: {
        id,
        userId,
      },
    } );
  },

  upsertByUserAndIp: async (
    userId: string,
    ipAddress: string,
    data: {
      name?: string;
      hostname?: string;
      macAddress?: string;
      vendor?: string;
      deviceType?: string;
      intf?: string;
      intfDescription?: string;
      notes?: string;
      isNewOnCreate: boolean;
      firstSeenAt: Date;
      lastSeenAt: Date;
    },
  ) => {
    return db.networkDevice.upsert( {
      where: {
        userId_ipAddress: {
          userId,
          ipAddress,
        },
      },
      create: {
        userId,
        ipAddress,
        name: data.name,
        hostname: data.hostname,
        macAddress: data.macAddress,
        vendor: data.vendor,
        deviceType: data.deviceType,
        intf: data.intf,
        intfDescription: data.intfDescription,
        notes: data.notes,
        isNew: data.isNewOnCreate,
        firstSeenAt: data.firstSeenAt,
        lastSeenAt: data.lastSeenAt,
      },
      update: {
        name: data.name,
        hostname: data.hostname,
        macAddress: data.macAddress,
        vendor: data.vendor,
        deviceType: data.deviceType,
        intf: data.intf,
        intfDescription: data.intfDescription,
        notes: data.notes,
        lastSeenAt: data.lastSeenAt,
      },
    } );
  },

  update: async (
    id: string,
    _userId: string,
    data: {
      name?: string;
      hostname?: string;
      macAddress?: string;
      vendor?: string;
      deviceType?: string;
      intf?: string;
      intfDescription?: string;
      notes?: string;
      isNew?: boolean;
    },
  ) => {
    return db.networkDevice.update( {
      where: {
        id,
      },
      data,
    } );
  },

  delete: async ( id: string, _userId: string ) => {
    return db.networkDevice.delete( {
      where: {
        id,
      },
    } );
  },
};
