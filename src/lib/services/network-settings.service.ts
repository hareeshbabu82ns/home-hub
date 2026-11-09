import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { networkSettingsRepository } from "@/lib/db/repositories";
import type { OpnsenseConnection } from "@/lib/services/opnsense-client";

export interface NetworkSettingsSummary {
  apiBaseUrl: string;
  defaultSubnet: string | null;
  verifyTls: boolean;
  hasApiKey: boolean;
  /** Last 4 characters only; the key itself never leaves the server. */
  apiKeyHint: string | null;
  hasApiSecret: boolean;
}

class NetworkSettingsService {
  async getSummary( userId: string ): Promise<NetworkSettingsSummary | null> {
    const settings = await networkSettingsRepository.findByUserId( userId );
    if ( !settings ) return null;
    return {
      apiBaseUrl: settings.apiBaseUrl,
      defaultSubnet: settings.defaultSubnet,
      verifyTls: settings.verifyTls,
      hasApiKey: settings.apiKey.length > 0,
      apiKeyHint: settings.apiKey.length > 4 ? settings.apiKey.slice( -4 ) : null,
      hasApiSecret: settings.apiSecret.length > 0,
    };
  }

  /** Decrypted router connection, or null when not configured. */
  async getConnection(
    userId: string,
  ): Promise<( OpnsenseConnection & { defaultSubnet: string | null } ) | null> {
    const settings = await networkSettingsRepository.findByUserId( userId );
    if ( !settings ) return null;
    return {
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      apiSecret: decryptSecret( settings.apiSecret ),
      verifyTls: settings.verifyTls,
      defaultSubnet: settings.defaultSubnet,
    };
  }

  /** Blank apiKey/apiSecret keep the stored values. */
  async save(
    userId: string,
    input: {
      apiBaseUrl: string;
      apiKey?: string;
      apiSecret?: string;
      defaultSubnet?: string;
      verifyTls?: boolean;
    },
  ): Promise<NetworkSettingsSummary> {
    const existing = await networkSettingsRepository.findByUserId( userId );
    const apiKey = input.apiKey?.trim() || existing?.apiKey;
    const apiSecret = input.apiSecret
      ? encryptSecret( input.apiSecret )
      : existing?.apiSecret;

    if ( !apiKey || !apiSecret ) {
      throw new Error( "API key and secret are required" );
    }

    await networkSettingsRepository.upsertByUserId( userId, {
      apiBaseUrl: input.apiBaseUrl,
      apiKey,
      apiSecret,
      defaultSubnet: input.defaultSubnet,
      verifyTls: input.verifyTls,
    } );

    return ( await this.getSummary( userId ) )!;
  }
}

export const networkSettingsService = new NetworkSettingsService();
