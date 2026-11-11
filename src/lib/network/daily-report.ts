import { db } from "@/lib/db";
import { resend } from "@/lib/email";
import {
  describeReason,
  localDateString,
  localTime,
  resolveTimeZone,
  shiftDateString,
} from "@/lib/network/access-policy";
import { getDeviceDisplayName } from "@/lib/network/device-display";
import { getDeviceHistory } from "@/lib/network/device-history";
import { loadAccessDecisions } from "@/lib/network/enforcement";
import { formatBytes } from "@/lib/network/format";

/**
 * Daily email with the previous local day's stats for every favorite device:
 * usage, DNS, time online, busiest hour, top domains, and how the day compares
 * with the device's recent average.
 */

export const DEFAULT_REPORT_HOUR = 7;
const RETRY_AFTER_MS = 30 * 60_000;
const lastAttempt = new Map<string, number>(); // userId → last failed send

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

export async function buildDailyReport(userId: string, date: string) {
  const { settings, devices, decisions, timeZone } = await loadAccessDecisions(userId);
  const favorites = devices
    .filter((device) => device.isFavorite)
    .sort((a, b) => getDeviceDisplayName(a).localeCompare(getDeviceDisplayName(b)));
  if (favorites.length === 0) return null;

  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/api\/auth\/?$/, "") ?? "";
  const timeLabel = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const cell = 'style="padding:4px 12px 4px 0;vertical-align:top"';
  const muted = 'style="color:#666"';

  const sections: string[] = [];
  let totalBytes = 0;
  for (const device of favorites) {
    const history = await getDeviceHistory(userId, device.id, timeZone, date);
    const { day } = history;
    const bytes = day.totals.bytesIn + day.totals.bytesOut;
    totalBytes += bytes;

    // Compare with the average of the earlier days that have any usage.
    const earlier = history.daily.slice(0, -1).map((row) => row.bytesIn + row.bytesOut).filter((value) => value > 0);
    const average = earlier.length ? earlier.reduce((sum, value) => sum + value, 0) / earlier.length : null;
    const comparison =
      average === null
        ? "no earlier usage to compare"
        : `${bytes >= average ? "+" : "−"}${Math.abs(Math.round(((bytes - average) / average) * 100))}% vs ${formatBytes(average)} average (${earlier.length} days)`;

    const access = decisions.get(device.id);
    const status = access?.blocked
      ? `No access now: ${access.reasons.map(describeReason).join(", ")}`
      : device.isOnline
        ? "Online now"
        : "Offline now";

    const rows: [string, string][] = [
      ["Total", `<strong>${formatBytes(bytes)}</strong> <span ${muted}>(${escapeHtml(comparison)})</span>`],
      ["Download / upload", `${formatBytes(day.totals.bytesIn)} / ${formatBytes(day.totals.bytesOut)}`],
    ];
    if (device.dailyQuotaMB) {
      rows.push(["Daily quota", `${Math.round(bytes / 1e6)} of ${device.dailyQuotaMB} MB (${Math.round((bytes / 1e6 / device.dailyQuotaMB) * 100)}%)`]);
    }
    rows.push(
      ["Busiest hour", day.peakHour ? `${day.peakHour.label} (${formatBytes(day.peakHour.bytes)})` : "-"],
      ["Time online", day.onlineMs === null ? "not recorded" : formatDuration(day.onlineMs)],
      [
        "Online / offline",
        day.presence.length
          ? day.presence
              .slice(0, 12)
              .map((entry) => `${entry.online ? "on" : "off"} ${timeLabel.format(new Date(entry.at))}`)
              .join(", ") + (day.presence.length > 12 ? `, +${day.presence.length - 12} more` : "")
          : "no changes",
      ],
      ["DNS queries", `${day.totals.dnsQueries} (${day.totals.dnsBlocked} blocked)`],
      [
        "Top domains",
        day.domains.length
          ? day.domains
              .slice(0, 8)
              .map((row) => `${escapeHtml(row.domain)} <span ${muted}>${row.queries}${row.blocked ? `, ${row.blocked} blocked` : ""}</span>`)
              .join("<br>")
          : "-",
      ],
      ["Status", escapeHtml(status)],
    );

    const name = escapeHtml(getDeviceDisplayName(device));
    sections.push(
      `<h3 style="margin:24px 0 4px"><a href="${baseUrl}/network/devices/${device.id}">${name}</a> <span ${muted} style="font-weight:normal;font-size:13px;color:#666">${escapeHtml(device.ipAddress)}</span></h3>` +
        `<table style="border-collapse:collapse;font-size:14px">${rows
          .map(([label, value]) => `<tr><td ${cell}><span ${muted}>${label}</span></td><td ${cell}>${value}</td></tr>`)
          .join("")}</table>`,
    );
  }

  const dayLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(
    new Date(`${date}T12:00:00Z`),
  );
  return {
    to:
      settings?.alertEmail ||
      (await db.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ||
      null,
    subject: `[Home Hub] Favorite devices: ${dayLabel}`,
    html:
      `<div style="font-family:system-ui,sans-serif;color:#111">` +
      `<h2 style="margin-bottom:4px">Favorite devices on ${dayLabel}</h2>` +
      `<p ${muted} style="margin-top:0;color:#666">${favorites.length} device${favorites.length === 1 ? "" : "s"} · ${formatBytes(totalBytes)} in total · usage is estimated from sampled traffic (${escapeHtml(timeZone)})</p>` +
      sections.join("") +
      `<p style="margin-top:24px"><a href="${baseUrl}/network/devices">Open Home Hub</a></p></div>`,
    devices: favorites.length,
  };
}

/** Sends the report for `date` (default: yesterday). Throws with a user-facing message. */
export async function sendDailyReport(userId: string, date?: string) {
  if (!resend) throw new Error("Email isn't configured (RESEND_API_KEY)");
  const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
  const timeZone = resolveTimeZone(settings?.timezone);
  const day = date ?? shiftDateString(localDateString(new Date(), timeZone), -1);
  const report = await buildDailyReport(userId, day);
  if (!report) throw new Error("No favorite devices yet: star a device first");
  if (!report.to) throw new Error("No email address to send to");
  const result = await resend.emails.send({
    from: process.env.HOME_HUB_EMAIL_FROM || "Home Hub <onboarding@resend.dev>",
    to: report.to,
    subject: report.subject,
    html: report.html,
  });
  if (result.error) throw new Error(`Email provider: ${result.error.message}`);
  return { to: report.to, date: day, devices: report.devices };
}

/** Collector tick: sends yesterday's report once, after the configured hour. */
export async function maybeSendDailyReport(userId: string, now = new Date()) {
  if (!resend) return;
  const settings = await db.networkIntegrationSettings.findUnique({ where: { userId } });
  if (!settings?.dailyReportEnabled) return;
  const timeZone = resolveTimeZone(settings.timezone);
  if (localTime(now, timeZone).minute < (settings.dailyReportHour ?? DEFAULT_REPORT_HOUR) * 60) return;

  const date = shiftDateString(localDateString(now, timeZone), -1);
  const state = await db.networkCollectorState.findUnique({ where: { userId } });
  if (state?.dailyReportDate === date) return;
  if (now.getTime() - (lastAttempt.get(userId) ?? 0) < RETRY_AFTER_MS) return;

  const done = () =>
    db.networkCollectorState.upsert({
      where: { userId },
      create: { userId, dailyReportDate: date },
      update: { dailyReportDate: date },
    });
  if (!(await db.networkDevice.count({ where: { userId, isFavorite: true } }))) {
    await done(); // nothing to report today
    return;
  }
  try {
    const sent = await sendDailyReport(userId, date);
    await done();
    console.info(`[daily-report] sent ${date} for ${sent.devices} device(s) to ${sent.to}`);
  } catch (error) {
    lastAttempt.set(userId, now.getTime());
    throw error;
  }
}
