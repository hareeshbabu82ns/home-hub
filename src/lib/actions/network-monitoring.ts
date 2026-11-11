"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";

import { db } from "@/lib/db";
import { getAppDb } from "@/lib/db/mongo-native";
import { resend } from "@/lib/email";
import { errorMessage, getActor, NOT_CONFIGURED, requireManager } from "@/lib/network/action-helpers";
import { unset } from "@/lib/network/alerts";
import { DEFAULT_REPORT_HOUR, sendDailyReport } from "@/lib/network/daily-report";
import { COLLECTIONS } from "@/lib/network/collector/collections";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { networkAuditService } from "@/lib/services/network-audit.service";
import { networkSettingsService } from "@/lib/services/network-settings.service";
import { OpnsenseApiError, opnsenseRequest } from "@/lib/services/opnsense-client";

/** Phase 4: alerts, live connections and the internal-flows report. */

function fail( error: unknown, fallback: string ) {
  const message =
    error instanceof Error && [ NOT_CONFIGURED, "Device not found" ].includes( error.message )
      ? error.message
      : errorMessage( error, fallback );
  return { success: false as const, error: message };
}

async function connectionFor( userId: string ) {
  const connection = await networkSettingsService.getConnection( userId );
  if ( !connection ) throw new Error( NOT_CONFIGURED );
  return {
    apiBaseUrl: connection.apiBaseUrl,
    apiKey: connection.apiKey,
    apiSecret: connection.apiSecret,
    verifyTls: connection.verifyTls,
  };
}

// ------------------------------------------------------------------ alerts

export async function getNetworkAlerts( options: { includeResolved?: boolean } = {} ) {
  try {
    const { userId, canManage } = await getActor();
    const alerts = await db.networkAlert.findMany( {
      where: { userId, ...( options.includeResolved ? {} : unset( "resolvedAt" ) ) },
      orderBy: { createdAt: "desc" },
      take: 200,
    } );
    return {
      success: true as const,
      data: {
        canManage,
        alerts: alerts.map( ( alert ) => ( {
          id: alert.id,
          kind: alert.kind,
          severity: alert.severity as "info" | "warning" | "critical",
          title: alert.title,
          message: alert.message,
          deviceId: alert.deviceId,
          createdAt: alert.createdAt.toISOString(),
          resolvedAt: alert.resolvedAt?.toISOString() ?? null,
          read: !!alert.readAt,
          emailed: !!alert.notifiedAt,
        } ) ),
      },
    };
  } catch ( error ) {
    return fail( error, "Failed to load alerts" );
  }
}

/** Unread, unresolved alerts: for the navigation badge. */
export async function getOpenAlertCount() {
  try {
    const { userId } = await getActor();
    const count = await db.networkAlert.count( {
      where: { userId, AND: [ unset( "resolvedAt" ), unset( "readAt" ) ] },
    } );
    return { success: true as const, count };
  } catch {
    return { success: true as const, count: 0 };
  }
}

export async function markAlertsRead( ids?: string[] ) {
  try {
    const { userId } = await getActor();
    await db.networkAlert.updateMany( {
      where: { userId, ...unset( "readAt" ), ...( ids ? { id: { in: ids } } : {} ) },
      data: { readAt: new Date() },
    } );
    return { success: true as const };
  } catch ( error ) {
    return fail( error, "Failed to update alerts" );
  }
}

const alertSettingsSchema = z.object( {
  alertEmailEnabled: z.boolean(),
  alertEmail: z.union( [ z.literal( "" ), z.string().email( "Enter a valid email" ) ] ).optional(),
  alertMinSeverity: z.enum( [ "info", "warning", "critical" ] ),
  dailyReportEnabled: z.boolean().optional(),
  dailyReportHour: z.number().int().min( 0 ).max( 23 ).optional(),
} );

export async function getAlertSettings() {
  try {
    const { userId, canManage, email } = await getActor();
    const settings = await db.networkIntegrationSettings.findUnique( { where: { userId } } );
    return {
      success: true as const,
      data: {
        canManage,
        emailConfigured: !!resend,
        accountEmail: email,
        alertEmailEnabled: settings?.alertEmailEnabled ?? false,
        alertEmail: settings?.alertEmail ?? "",
        alertMinSeverity: ( settings?.alertMinSeverity ?? "warning" ) as "info" | "warning" | "critical",
        dailyReportEnabled: settings?.dailyReportEnabled ?? false,
        dailyReportHour: settings?.dailyReportHour ?? DEFAULT_REPORT_HOUR,
      },
    };
  } catch ( error ) {
    return fail( error, "Failed to load alert settings" );
  }
}

export async function saveAlertSettings( values: z.infer<typeof alertSettingsSchema> ) {
  try {
    const { userId, email } = await requireManager();
    const parsed = alertSettingsSchema.parse( values );
    const existing = await db.networkIntegrationSettings.findUnique( { where: { userId } } );
    if ( !existing ) return { success: false as const, error: NOT_CONFIGURED };
    await networkAuditService.track(
      { userId, actorEmail: email, action: "alert-settings", details: parsed },
      () =>
        db.networkIntegrationSettings.update( {
          where: { userId },
          data: {
            alertEmailEnabled: parsed.alertEmailEnabled,
            alertEmail: parsed.alertEmail || null,
            alertMinSeverity: parsed.alertMinSeverity,
            ...( parsed.dailyReportEnabled === undefined ? {} : { dailyReportEnabled: parsed.dailyReportEnabled } ),
            ...( parsed.dailyReportHour === undefined ? {} : { dailyReportHour: parsed.dailyReportHour } ),
          },
        } ),
    );
    return { success: true as const };
  } catch ( error ) {
    return fail( error, "Failed to save alert settings" );
  }
}

/** Sends one test email to the configured alert address. */
export async function sendTestAlertEmail() {
  try {
    const { userId, email } = await requireManager();
    if ( !resend ) return { success: false as const, error: "Email isn't configured (RESEND_API_KEY)" };
    const settings = await db.networkIntegrationSettings.findUnique( { where: { userId } } );
    const to = settings?.alertEmail || email;
    if ( !to ) return { success: false as const, error: "No email address to send to" };
    const result = await resend.emails.send( {
      from: process.env.HOME_HUB_EMAIL_FROM || "Home Hub <onboarding@resend.dev>",
      to,
      subject: "[Home Hub] Test alert",
      html: "<p>Network alerts from Home Hub will arrive like this.</p>",
    } );
    if ( result.error ) return { success: false as const, error: `Email provider: ${result.error.message}` };
    await networkAuditService.record( { userId, actorEmail: email, action: "alert-test-email", target: to, success: true } );
    return { success: true as const, to };
  } catch ( error ) {
    return fail( error, "Failed to send test email" );
  }
}

/** Sends yesterday's favorite-devices report right away. */
export async function sendDailyReportNow() {
  try {
    const { userId, email } = await requireManager();
    const sent = await sendDailyReport( userId );
    await networkAuditService.record( { userId, actorEmail: email, action: "daily-report-email", target: sent.to, success: true } );
    return { success: true as const, ...sent };
  } catch ( error ) {
    // sendDailyReport's messages are written for the user.
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to send the report" };
  }
}

// ------------------------------------------------------------- connections

export interface DeviceConnection {
  id: string; // "<state id>/<creator id>"
  proto: string;
  direction: string;
  interface: string;
  src: string;
  dst: string;
  state: string;
  age: string;
  bytesIn: number;
  bytesOut: number;
}

function parsePair( value: unknown ): [ number, number ] {
  return Array.isArray( value ) ? [ Number( value[ 0 ] ) || 0, Number( value[ 1 ] ) || 0 ] : [ 0, 0 ];
}

function endpoint( addr: unknown, port: unknown ) {
  const ip = String( addr ?? "" );
  const p = port === undefined || port === null || port === "" ? "" : String( port );
  if ( !p ) return ip;
  return ip.includes( ":" ) ? `[${ip}]:${p}` : `${ip}:${p}`;
}

export async function getDeviceConnections( deviceId: string ) {
  try {
    const { userId, canManage } = await getActor();
    const device = await db.networkDevice.findFirst( { where: { id: deviceId, userId } } );
    if ( !device ) throw new Error( "Device not found" );
    const connection = await connectionFor( userId );

    const payload = await opnsenseRequest<{ rows?: Record<string, unknown>[]; total?: number }>(
      connection,
      "diagnostics/firewall/query_states",
      { body: { current: 1, rowCount: 300, searchPhrase: device.ipAddress } },
    );
    const rows = ( payload.rows ?? [] )
      .filter( ( row ) => row.src_addr === device.ipAddress || row.dst_addr === device.ipAddress )
      .map( ( row ): DeviceConnection => {
        const bytes = parsePair( row.bytes );
        return {
          id: String( row.id ?? "" ),
          proto: String( row.proto ?? "" ),
          direction: String( row.direction ?? "" ),
          interface: String( row.interface ?? row.iface ?? "" ),
          src: endpoint( row.src_addr, row.src_port ),
          dst: endpoint( row.dst_addr, row.dst_port ),
          state: String( row.state ?? "" ),
          age: String( row.age ?? "" ),
          bytesIn: bytes[ 0 ],
          bytesOut: bytes[ 1 ],
        };
      } );
    return { success: true as const, data: { canManage, total: payload.total ?? rows.length, rows } };
  } catch ( error ) {
    return fail( error, "Failed to load connections" );
  }
}

/** Closes one connection, or all of the device's connections when stateId is omitted. */
export async function closeDeviceConnections( values: { deviceId: string; stateId?: string } ) {
  try {
    const { userId, email } = await requireManager();
    const device = await db.networkDevice.findFirst( { where: { id: values.deviceId, userId } } );
    if ( !device ) throw new Error( "Device not found" );
    const connection = await connectionFor( userId );

    const dropped = await networkAuditService.track(
      {
        userId,
        actorEmail: email,
        action: values.stateId ? "close-connection" : "close-all-connections",
        target: getDeviceDisplayName( device ),
        deviceId: device.id,
        details: { stateId: values.stateId ?? null, ip: device.ipAddress },
      },
      async () => {
        if ( values.stateId ) {
          const [ id, creator ] = values.stateId.split( "/" );
          if ( !/^[0-9a-f]+$/i.test( id ?? "" ) || !/^[0-9a-f]+$/i.test( creator ?? "" ) ) {
            throw new OpnsenseApiError( "Invalid connection id" );
          }
          await opnsenseRequest( connection, `diagnostics/firewall/del_state/${id}/${creator}`, { body: {} } );
          return 1;
        }
        const result = await opnsenseRequest<{ dropped_states?: number }>(
          connection,
          "diagnostics/firewall/kill_states",
          { body: { filter: device.ipAddress } },
        );
        return result.dropped_states ?? 0;
      },
    );
    return { success: true as const, dropped };
  } catch ( error ) {
    return fail( error, "Failed to close connections" );
  }
}

// ----------------------------------------------------------- flows report

const ISOLATION_HINT = /(iot|camera|cam|tv|plug|bulb|light|speaker|thermostat|sensor|doorbell)/i;

export async function getInternalFlowsReport( days = 7 ) {
  try {
    const { userId } = await getActor();
    const mongo = await getAppDb();
    const since = new Date( Date.now() - Math.min( Math.max( days, 1 ), 30 ) * 24 * 60 * 60 * 1000 );
    since.setUTCHours( 0, 0, 0, 0 );

    const rows = await mongo
      .collection( COLLECTIONS.internalFlows )
      .aggregate<{
        _id: { src: ObjectId; dstIp: string; proto: string; port: number };
        samples: number;
        lastSeenAt: Date;
        dstDeviceId?: ObjectId;
      }>( [
        { $match: { userId: new ObjectId( userId ), day: { $gte: since } } },
        {
          $group: {
            _id: { src: "$srcDeviceId", dstIp: "$dstIp", proto: "$proto", port: "$dstPort" },
            samples: { $sum: "$samples" },
            lastSeenAt: { $max: "$lastSeenAt" },
            dstDeviceId: { $last: "$dstDeviceId" },
          },
        },
        { $sort: { samples: -1 } },
        { $limit: 1000 },
      ] )
      .toArray();

    const ids = [
      ...new Set( rows.flatMap( ( row ) => [ row._id.src.toHexString(), row.dstDeviceId?.toHexString() ].filter( Boolean ) as string[] ) ),
    ];
    const devices = await db.networkDevice.findMany( { where: { userId, id: { in: ids } } } );
    const byId = new Map( devices.map( ( device ) => [ device.id, device ] ) );

    const sources = new Map<
      string,
      {
        deviceId: string;
        name: string;
        deviceType: string | null;
        flagged: boolean;
        flows: { dstIp: string; dstName: string | null; proto: string; port: number; samples: number; lastSeenAt: string }[];
      }
    >();
    for ( const row of rows ) {
      const srcId = row._id.src.toHexString();
      const device = byId.get( srcId );
      const entry = sources.get( srcId ) ?? {
        deviceId: srcId,
        name: device ? getDeviceDisplayName( device ) : "Removed device",
        deviceType: device?.deviceType ?? null,
        flagged: ISOLATION_HINT.test( `${device?.deviceType ?? ""} ${device?.name ?? ""}` ),
        flows: [],
      };
      const dst = row.dstDeviceId ? byId.get( row.dstDeviceId.toHexString() ) : undefined;
      entry.flows.push( {
        dstIp: row._id.dstIp,
        dstName: dst ? getDeviceDisplayName( dst ) : null,
        proto: row._id.proto,
        port: row._id.port,
        samples: row.samples,
        lastSeenAt: row.lastSeenAt.toISOString(),
      } );
      sources.set( srcId, entry );
    }

    return {
      success: true as const,
      data: {
        days,
        sources: [ ...sources.values() ].sort(
          ( a, b ) => Number( b.flagged ) - Number( a.flagged ) || b.flows.length - a.flows.length,
        ),
      },
    };
  } catch ( error ) {
    return fail( error, "Failed to load internal connections" );
  }
}
