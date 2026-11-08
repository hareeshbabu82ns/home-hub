import { db } from "@/lib/db";
import { resend } from "@/lib/email";

/**
 * Network alerts (Phase 4). One open alert per dedupeKey: raising an alert
 * that is already open does nothing, and conditions that clear resolve it.
 * Alerts at or above the user's minimum severity are emailed once.
 */

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertKind =
  | "new_device"
  | "gateway_down"
  | "gateway_degraded"
  | "router_unreachable"
  | "quota_exceeded"
  | "enforcement_failed"
  | "ip_conflict"
  | "router_resources";

export interface AlertInput {
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  message: string;
  dedupeKey: string;
  deviceId?: string;
}

/**
 * Prisma on MongoDB stores omitted optional fields as *missing*, and
 * `field: null` doesn't match missing fields; match both.
 */
export function unset<K extends string>( field: K ) {
  return { OR: [ { [ field ]: null }, { [ field ]: { isSet: false } } ] } as unknown as Record<K, null>;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { info: 0, warning: 1, critical: 2 };
const EMAILS_PER_HOUR = 10;
const sentLog = new Map<string, number[]>(); // userId → send timestamps

function emailAllowed( userId: string ) {
  const now = Date.now();
  const recent = ( sentLog.get( userId ) ?? [] ).filter( ( t ) => now - t < 3_600_000 );
  sentLog.set( userId, recent );
  if ( recent.length >= EMAILS_PER_HOUR ) return false;
  recent.push( now );
  return true;
}

function escapeHtml( text: string ) {
  return text.replace( /[&<>"']/g, ( c ) => `&#${c.charCodeAt( 0 )};` );
}

async function notify( userId: string, alert: { id: string } & AlertInput ) {
  const settings = await db.networkIntegrationSettings.findUnique( { where: { userId } } );
  if ( !settings?.alertEmailEnabled || !resend ) return;
  const minimum = ( settings.alertMinSeverity as AlertSeverity | null ) ?? "warning";
  if ( SEVERITY_RANK[ alert.severity ] < SEVERITY_RANK[ minimum ] ) return;
  if ( !emailAllowed( userId ) ) {
    console.warn( `[alerts] email rate limit reached for user ${userId}` );
    return;
  }

  const to =
    settings.alertEmail ||
    ( await db.user.findUnique( { where: { id: userId }, select: { email: true } } ) )?.email;
  if ( !to ) return;

  const baseUrl = process.env.NEXTAUTH_URL?.replace( /\/api\/auth\/?$/, "" ) ?? "";
  const link = alert.deviceId ? `${baseUrl}/network/devices/${alert.deviceId}` : `${baseUrl}/network/alerts`;
  try {
    await resend.emails.send( {
      from: process.env.HOME_HUB_EMAIL_FROM || "Home Hub <onboarding@resend.dev>",
      to,
      subject: `[Home Hub] ${alert.title}`,
      html: `<h2>${escapeHtml( alert.title )}</h2><p>${escapeHtml( alert.message )}</p><p><a href="${link}">Open in Home Hub</a></p>`,
    } );
    await db.networkAlert.update( { where: { id: alert.id }, data: { notifiedAt: new Date() } } );
  } catch ( error ) {
    console.error( "[alerts] email failed", error );
  }
}

/** Opens an alert unless one with the same dedupeKey is already open. */
export async function raiseAlert( userId: string, input: AlertInput ) {
  const open = await db.networkAlert.findFirst( {
    where: { userId, dedupeKey: input.dedupeKey, ...unset( "resolvedAt" ) },
  } );
  if ( open ) return null;
  const alert = await db.networkAlert.create( {
    // Explicit nulls so the fields exist (see unset()).
    data: { userId, ...input, resolvedAt: null, readAt: null, notifiedAt: null },
  } );
  // Don't hold up the collector on the email provider (seen taking ~80s).
  void notify( userId, { id: alert.id, ...input } ).catch( ( error ) =>
    console.error( "[alerts] notify failed", error ),
  );
  return alert;
}

export async function resolveAlert( userId: string, dedupeKey: string ) {
  await db.networkAlert.updateMany( {
    where: { userId, dedupeKey, ...unset( "resolvedAt" ) },
    data: { resolvedAt: new Date() },
  } );
}

/**
 * For conditions evaluated as a set (e.g. all gateways): resolves open alerts
 * of `kind` whose key is not in `activeKeys`.
 */
export async function resolveAllExcept( userId: string, kind: AlertKind, activeKeys: string[] ) {
  await db.networkAlert.updateMany( {
    where: { userId, kind, dedupeKey: { notIn: activeKeys }, ...unset( "resolvedAt" ) },
    data: { resolvedAt: new Date() },
  } );
}
