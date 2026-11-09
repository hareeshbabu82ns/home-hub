/**
 * Parsers for OPNsense diagnostics payloads used by the collector and the
 * router page. All of them tolerate missing fields; values the router doesn't
 * report come back undefined.
 */

type Row = Record<string, unknown>;

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** `diagnostics/activity/get_activity` → CPU busy % from top's header line. */
export function parseCpuPct(activity: unknown): number | undefined {
  const headers = (activity as Row | null)?.headers;
  if (!Array.isArray(headers)) return undefined;
  const line = headers.find((h): h is string => typeof h === "string" && h.startsWith("CPU:"));
  const idle = line?.match(/([\d.]+)% idle/)?.[1];
  return idle === undefined ? undefined : Math.max(0, Math.min(100, 100 - parseFloat(idle)));
}

/** `diagnostics/system/system_resources` → memory used %. */
export function parseMemory(resources: unknown) {
  const memory = (resources as Row | null)?.memory as Row | undefined;
  const total = num(memory?.total);
  const used = num(memory?.used);
  if (!total || used === undefined) return undefined;
  return { totalBytes: total, usedBytes: used, usedPct: (used / total) * 100 };
}

/** `diagnostics/system/system_time` → uptime text and 1-minute load. */
export function parseSystemTime(time: unknown) {
  const row = (time ?? {}) as Row;
  const loadavg = typeof row.loadavg === "string" ? row.loadavg : undefined;
  return {
    uptime: typeof row.uptime === "string" ? row.uptime : undefined,
    load1: loadavg ? num(loadavg.split(",")[0]) : undefined,
    loadavg,
  };
}

/** `diagnostics/system/system_disk` → the root filesystem. */
export function parseRootDisk(disk: unknown) {
  const devices = (disk as Row | null)?.devices;
  if (!Array.isArray(devices)) return undefined;
  const root = devices.find((d) => (d as Row)?.mountpoint === "/") as Row | undefined;
  if (!root) return undefined;
  return {
    usedPct: num(root.used_pct),
    used: typeof root.used === "string" ? root.used : undefined,
    size: typeof root.blocks === "string" ? root.blocks : undefined,
  };
}

/** `routes/gateway/status` → gateways with numeric delay/loss when monitored. */
export function parseGateways(status: unknown) {
  const items = (status as Row | null)?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Row => typeof item === "object" && item !== null)
    .map((item) => ({
      name: String(item.name ?? ""),
      address: typeof item.address === "string" ? item.address : undefined,
      status: String(item.status_translated ?? item.status ?? "unknown"),
      delayMs: num(item.delay), // "~" when not monitored → undefined
      lossPct: num(item.loss),
    }));
}

export interface InterfaceCounters {
  key: string; // config key: lan, wan, opt1…
  device: string;
  name: string;
  rxBytes: number;
  txBytes: number;
}

/** `diagnostics/traffic/interface` → cumulative byte counters per interface. */
export function parseInterfaceCounters(
  payload: unknown,
  names: Record<string, string> = {},
): InterfaceCounters[] {
  const interfaces = (payload as Row | null)?.interfaces as Row | undefined;
  if (!interfaces) return [];
  return Object.entries(interfaces).flatMap(([key, value]) => {
    const row = value as Row;
    const rxBytes = num(row["bytes received"]);
    const txBytes = num(row["bytes transmitted"]);
    if (rxBytes === undefined || txBytes === undefined) return [];
    const device = String(row.device ?? key);
    return [{ key, device, name: names[device] ?? (typeof row.name === "string" ? row.name : key), rxBytes, txBytes }];
  });
}

/** Rates (bytes/s) from two counter snapshots; skips resets and bad intervals. */
export function counterRates(
  previous: { at: number; counters: InterfaceCounters[] } | undefined,
  current: { at: number; counters: InterfaceCounters[] },
): Record<string, { rxBps: number; txBps: number }> {
  if (!previous) return {};
  const seconds = (current.at - previous.at) / 1000;
  if (seconds <= 0 || seconds > 600) return {};
  const before = new Map(previous.counters.map((c) => [c.key, c]));
  const rates: Record<string, { rxBps: number; txBps: number }> = {};
  for (const counter of current.counters) {
    const prior = before.get(counter.key);
    if (!prior) continue;
    const rx = counter.rxBytes - prior.rxBytes;
    const tx = counter.txBytes - prior.txBytes;
    if (rx < 0 || tx < 0) continue; // counter reset (reboot)
    rates[counter.key] = { rxBps: rx / seconds, txBps: tx / seconds };
  }
  return rates;
}
