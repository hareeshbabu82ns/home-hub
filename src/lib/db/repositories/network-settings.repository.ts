import { db } from "@/lib/db";

export const networkSettingsRepository = {
  findByUserId: async ( userId: string ) => {
    return db.networkIntegrationSettings.findUnique( {
      where: { userId },
    } );
  },

  upsertByUserId: async (
    userId: string,
    data: {
      apiBaseUrl: string;
      apiKey: string;
      apiSecret: string;
      defaultSubnet?: string;
      verifyTls?: boolean;
    },
  ) => {
    return db.networkIntegrationSettings.upsert( {
      where: { userId },
      create: {
        userId,
        apiBaseUrl: data.apiBaseUrl,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        defaultSubnet: data.defaultSubnet,
        verifyTls: data.verifyTls ?? false,
      },
      update: {
        apiBaseUrl: data.apiBaseUrl,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        defaultSubnet: data.defaultSubnet,
        verifyTls: data.verifyTls ?? false,
      },
    } );
  },
};
