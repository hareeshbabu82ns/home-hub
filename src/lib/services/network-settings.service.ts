import { networkSettingsRepository } from "@/lib/db/repositories";

class NetworkSettingsService {
  async getByUserId( userId: string ) {
    return networkSettingsRepository.findByUserId( userId );
  }

  async saveByUserId(
    userId: string,
    input: {
      apiBaseUrl: string;
      apiKey: string;
      apiSecret: string;
      defaultSubnet?: string;
      verifyTls?: boolean;
    },
  ) {
    return networkSettingsRepository.upsertByUserId( userId, input );
  }
}

export const networkSettingsService = new NetworkSettingsService();
