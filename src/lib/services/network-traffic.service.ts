import { opnsenseRequest, type OpnsenseConnection } from "@/lib/services/opnsense-client";

interface TrafficTopLanDetail {
  address: string;
  rate: string | undefined;
  rateBits: number;
  cumulative: string | undefined;
  cumulativeBytes: number;
  tags: string[];
}

export interface TrafficTopLanRecord {
  address: string;
  rateBitsIn: number;
  rateBitsOut: number;
  rateBits: number;
  cumulativeBytesIn: number;
  cumulativeBytesOut: number;
  cumulativeBytes: number;
  tags: string[];
  details: TrafficTopLanDetail[];
  rname: string;
  rateIn: string | undefined;
  rateOut: string | undefined;
  rate: string | undefined;
  cumulativeIn: string | undefined;
  cumulativeOut: string | undefined;
  cumulative: string | undefined;
}

function asString( value: unknown ): string {
  if ( typeof value !== "string" ) {
    return "";
  }

  return value;
}

function asNumber( value: unknown ): number {
  if ( typeof value === "number" && Number.isFinite( value ) ) {
    return value;
  }

  if ( typeof value === "string" ) {
    const parsed = Number( value );
    if ( Number.isFinite( parsed ) ) {
      return parsed;
    }
  }

  return 0;
}

function asStringArray( value: unknown ): string[] {
  if ( !Array.isArray( value ) ) {
    return [];
  }

  return value.filter( ( item ): item is string => typeof item === "string" );
}

function mapDetails( value: unknown ): TrafficTopLanDetail[] {
  if ( !Array.isArray( value ) ) {
    return [];
  }

  return value
    .map( ( item ) => {
      if ( typeof item !== "object" || item === null ) {
        return null;
      }

      const row = item as Record<string, unknown>;
      const address = asString( row.address );
      if ( !address ) {
        return null;
      }

      return {
        address,
        rate: asString( row.rate ) || undefined,
        rateBits: asNumber( row.rate_bits ),
        cumulative: asString( row.cumulative ) || undefined,
        cumulativeBytes: asNumber( row.cumulative_bytes ),
        tags: asStringArray( row.tags ),
      } satisfies TrafficTopLanDetail;
    } )
    .filter( ( row ): row is NonNullable<typeof row> & TrafficTopLanDetail => row !== null );
}

function mapRecords( payload: unknown ): TrafficTopLanRecord[] {
  if ( typeof payload !== "object" || payload === null ) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const lan = root.lan as Record<string, unknown> | undefined;
  const records = lan?.records;

  if ( !Array.isArray( records ) ) {
    return [];
  }

  return records
    .map( ( item ) => {
      if ( typeof item !== "object" || item === null ) {
        return null;
      }

      const row = item as Record<string, unknown>;
      const address = asString( row.address );
      if ( !address ) {
        return null;
      }

      return {
        address,
        rateBitsIn: asNumber( row.rate_bits_in ),
        rateBitsOut: asNumber( row.rate_bits_out ),
        rateBits: asNumber( row.rate_bits ),
        cumulativeBytesIn: asNumber( row.cumulative_bytes_in ),
        cumulativeBytesOut: asNumber( row.cumulative_bytes_out ),
        cumulativeBytes: asNumber( row.cumulative_bytes ),
        tags: asStringArray( row.tags ),
        details: mapDetails( row.details ),
        rname: asString( row.rname ),
        rateIn: asString( row.rate_in ) || undefined,
        rateOut: asString( row.rate_out ) || undefined,
        rate: asString( row.rate ) || undefined,
        cumulativeIn: asString( row.cumulative_in ) || undefined,
        cumulativeOut: asString( row.cumulative_out ) || undefined,
        cumulative: asString( row.cumulative ) || undefined,
      } satisfies TrafficTopLanRecord;
    } )
    .filter( ( row ): row is NonNullable<typeof row> & TrafficTopLanRecord => row !== null );
}

class NetworkTrafficService {
  /**
   * Top talkers per host on the given interface. OPNsense samples traffic
   * before answering, so this call takes ~2-4s; callers must not poll faster.
   */
  async getTopLan(
    input: OpnsenseConnection & { interfaces?: string },
  ): Promise<TrafficTopLanRecord[]> {
    const { interfaces = "lan", ...connection } = input;
    const payload = await opnsenseRequest(
      connection,
      `diagnostics/traffic/top/${encodeURIComponent( interfaces )}`,
      { method: "GET" },
    );
    return mapRecords( payload );
  }
}

export const networkTrafficService = new NetworkTrafficService();
