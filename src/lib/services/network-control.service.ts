import { opnsenseRequest, OpnsenseApiError, type OpnsenseConnection } from "@/lib/services/opnsense-client";

/**
 * Router writes for Phase 3 control. Everything Home Hub creates on the router
 * is named HH_* / described "home-hub:*" so it can be found again and is
 * recognisable in the OPNsense UI.
 */

export const BLOCK_ALIAS = "HH_Block";
export const BLOCK_RULE_DESCRIPTION = "home-hub:block (managed by Home Hub)";
export const LEGACY_BLOCK_ALIAS = "Blocked_Devices";

type Row = Record<string, unknown>;

/** OPNsense mutations answer 200 with {result: "failed", validations} on errors. */
// Reloads (filter, Unbound, Dnsmasq) can take well over the default 15s.
const RELOAD_TIMEOUT_MS = 120_000;

async function mutate<T extends Row = Row>(
  connection: OpnsenseConnection,
  path: string,
  body: Row = {},
  timeoutMs?: number,
): Promise<T> {
  const result = await opnsenseRequest<T>(connection, path, { body, timeoutMs });
  const status = String(result?.result ?? result?.status ?? "").toLowerCase();
  if (status === "failed" || status === "error") {
    const validations = result?.validations as Record<string, string> | undefined;
    const detail = validations
      ? Object.entries(validations)
          .map(([field, message]) => `${field}: ${message}`)
          .join("; ")
      : JSON.stringify(result).slice(0, 200);
    throw new OpnsenseApiError(`Router rejected ${path}: ${detail}`);
  }
  return result;
}

/** Alias "content" comes back as an option map; flatten to the selected values. */
export function parseAliasContent(content: unknown): string[] {
  if (typeof content === "string") {
    return content.split(/\s+/).map((v) => v.trim()).filter(Boolean);
  }
  if (content && typeof content === "object") {
    return Object.entries(content as Record<string, unknown>)
      .filter(([, option]) => {
        if (!option || typeof option !== "object") return true;
        const selected = (option as Row).selected;
        return selected === undefined || selected === 1 || selected === "1" || selected === true;
      })
      .map(([key, option]) =>
        option && typeof option === "object" && typeof (option as Row).value === "string"
          ? String((option as Row).value) || key
          : key,
      )
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function selectedOption(field: unknown): string | undefined {
  if (typeof field === "string") return field;
  if (field && typeof field === "object") {
    return Object.entries(field as Record<string, Row>).find(([, option]) => option?.selected)?.[0];
  }
  return undefined;
}

export interface DnsName {
  uuid: string;
  enabled: boolean;
  hostname: string;
  domain: string;
  ip: string;
  description: string;
}

/** Prefix marking DNSBL policies Home Hub owns (others are never touched). */
export const SITE_POLICY_PREFIX = "home-hub-sites:";

export interface SitePolicy {
  uuid: string;
  description: string;
  enabled: boolean;
  sourceNets: string[];
  /** Exact names (the domain itself). */
  blocklists: string[];
  /** Subdomains of these (not the domain itself; tested on OPNsense 26.1). */
  wildcards: string[];
  allowlists: string[];
}

export interface SitePolicyInput {
  description: string;
  enabled: boolean;
  sourceNets: string[];
  blocklists: string[];
  wildcards: string[];
  allowlists: string[];
}

/** Multi-value model fields come back as option maps; flatten to values. */
function multiValues(field: unknown): string[] {
  if (typeof field === "string") return field.split(",").map((v) => v.trim()).filter(Boolean);
  if (field && typeof field === "object") {
    return Object.entries(field as Record<string, Row>)
      .filter(([key, option]) => key && (option?.selected === undefined || option.selected === 1 || option.selected === "1"))
      .map(([key, option]) => (typeof option?.value === "string" && option.value ? option.value : key))
      .filter(Boolean);
  }
  return [];
}

export interface ControlSetupStatus {
  alias: { uuid: string; type?: string; macCount: number } | null;
  rule: { uuid: string; enabled: boolean; ipprotocol?: string } | null;
  legacyBlockedIps: string[];
  wolAvailable: boolean;
  routerDomain: string | null;
}

class NetworkControlService {
  async findAlias(connection: OpnsenseConnection, name: string) {
    // A missing alias answers 200 with []; network/HTTP errors must propagate
    // (treating a timeout as "missing" made enforcement report a false error).
    const lookup = await opnsenseRequest<{ uuid?: string } | []>(
      connection,
      `firewall/alias/get_alias_u_u_i_d/${encodeURIComponent(name)}`,
      { method: "GET" },
    );
    if (Array.isArray(lookup) || !lookup.uuid) return null;
    const item = await opnsenseRequest<{ alias?: Row }>(
      connection,
      `firewall/alias/get_item/${lookup.uuid}`,
      { method: "GET" },
    );
    return {
      uuid: lookup.uuid,
      type: selectedOption(item.alias?.type),
      content: parseAliasContent(item.alias?.content),
    };
  }

  async findBlockRule(connection: OpnsenseConnection) {
    const result = await opnsenseRequest<{ rows?: Row[] }>(connection, "firewall/filter/search_rule", {
      body: { current: 1, rowCount: 50, searchPhrase: "home-hub:block" },
    });
    const row = (result.rows ?? []).find((r) => String(r.description ?? "").startsWith("home-hub:block"));
    if (!row) return null;
    return {
      uuid: String(row.uuid),
      enabled: String(row.enabled) === "1",
      ipprotocol: typeof row.ipprotocol === "string" ? row.ipprotocol : undefined,
    };
  }

  async getSetupStatus(connection: OpnsenseConnection): Promise<ControlSetupStatus> {
    const [alias, rule, legacy, wolAvailable, info] = await Promise.all([
      this.findAlias(connection, BLOCK_ALIAS),
      this.findBlockRule(connection),
      this.listTable(connection, LEGACY_BLOCK_ALIAS).catch(() => [] as string[]),
      this.isWolAvailable(connection),
      opnsenseRequest<{ name?: string }>(connection, "diagnostics/system/system_information", {
        method: "GET",
      }).catch(() => ({}) as { name?: string }),
    ]);
    const name = info.name ?? "";
    return {
      alias: alias ? { uuid: alias.uuid, type: alias.type, macCount: alias.content.length } : null,
      rule,
      legacyBlockedIps: legacy,
      wolAvailable,
      routerDomain: name.includes(".") ? name.slice(name.indexOf(".") + 1) : null,
    };
  }

  /**
   * Creates the HH_Block MAC alias and one floating block rule that uses it.
   * Both are inert until a MAC is added to the alias. Idempotent.
   */
  async prepareRouter(connection: OpnsenseConnection) {
    const created: string[] = [];

    let alias = await this.findAlias(connection, BLOCK_ALIAS);
    if (alias && alias.type && alias.type !== "mac") {
      throw new OpnsenseApiError(
        `An alias named ${BLOCK_ALIAS} already exists with type "${alias.type}". Rename it on the router first.`,
      );
    }
    if (!alias) {
      const result = await mutate<{ uuid?: string }>(connection, "firewall/alias/add_item", {
        alias: {
          enabled: "1",
          name: BLOCK_ALIAS,
          type: "mac",
          content: "",
          description: "Home Hub: blocked devices (managed, edit in Home Hub)",
        },
      });
      // Needed once so the (empty) pf table exists for the rule.
      await mutate(connection, "firewall/alias/reconfigure", {}, RELOAD_TIMEOUT_MS);
      created.push(`alias ${BLOCK_ALIAS}`);
      alias = { uuid: String(result.uuid), type: "mac", content: [] };
    }

    let rule = await this.findBlockRule(connection);
    if (!rule) {
      const result = await mutate<{ uuid?: string }>(connection, "firewall/filter/add_rule", {
        rule: {
          enabled: "1",
          action: "block",
          quick: "1",
          interface: "", // floating: applies on every interface
          direction: "in",
          ipprotocol: "inet46",
          protocol: "any",
          source_net: BLOCK_ALIAS,
          destination_net: "any",
          log: "1",
          sequence: "1",
          description: BLOCK_RULE_DESCRIPTION,
        },
      });
      await mutate(connection, "firewall/filter/apply", {}, RELOAD_TIMEOUT_MS);
      created.push("floating block rule (IPv4+IPv6)");
      rule = { uuid: String(result.uuid), enabled: true, ipprotocol: "inet46" };
    } else if (!rule.enabled) {
      await mutate(connection, `firewall/filter/toggle_rule/${rule.uuid}/1`);
      await mutate(connection, "firewall/filter/apply", {}, RELOAD_TIMEOUT_MS);
      created.push("re-enabled block rule");
    }

    return { aliasUuid: alias.uuid, ruleUuid: rule.uuid, created };
  }

  /**
   * Saves the alias content to config.xml (so it survives reboots and filter
   * reloads) without forcing a reload: `alias/reconfigure` reloads the whole
   * firewall and can stall the router API for a minute. The reconciler updates
   * the live pf table directly instead.
   */
  async writeAliasMacs(connection: OpnsenseConnection, aliasUuid: string, macs: string[]) {
    await mutate(connection, `firewall/alias/set_item/${aliasUuid}`, {
      alias: { content: macs.join("\n") },
    });
  }

  async listTable(connection: OpnsenseConnection, alias: string): Promise<string[]> {
    const payload = await opnsenseRequest<{ rows?: unknown[] }>(
      connection,
      `firewall/alias_util/list/${encodeURIComponent(alias)}`,
      { body: { current: 1, rowCount: 5000 } },
    );
    return (payload.rows ?? [])
      .map((row) =>
        typeof row === "string" ? row : String((row as Row)?.ip ?? (row as Row)?.address ?? ""),
      )
      .filter(Boolean);
  }

  /** Runtime-only pf table change: immediate, until the alias is next resolved. */
  async addToTable(connection: OpnsenseConnection, alias: string, address: string) {
    await mutate(connection, `firewall/alias_util/add/${encodeURIComponent(alias)}`, { address });
  }

  async removeFromTable(connection: OpnsenseConnection, alias: string, address: string) {
    await mutate(connection, `firewall/alias_util/delete/${encodeURIComponent(alias)}`, { address });
  }

  /** Drops open connections involving `address` so a block takes effect now. */
  async killStates(connection: OpnsenseConnection, address: string): Promise<number> {
    const result = await opnsenseRequest<{ result?: string; dropped_states?: number }>(
      connection,
      "diagnostics/firewall/kill_states",
      { body: { filter: address } },
    );
    return result.dropped_states ?? 0;
  }

  async isWolAvailable(connection: OpnsenseConnection): Promise<boolean> {
    try {
      await opnsenseRequest(connection, "wol/wol/search_host", { body: { current: 1, rowCount: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  /** Interface config key (lan, opt1…) for a device name such as vtnet1. */
  async interfaceKeyFor(connection: OpnsenseConnection, device: string): Promise<string | null> {
    const payload = await opnsenseRequest<{ rows?: Row[] }>(connection, "interfaces/overview/interfaces_info", {
      method: "GET",
    });
    const row = (payload.rows ?? []).find((r) => r.device === device);
    const identifier = (row?.config as Row | undefined)?.identifier;
    return typeof identifier === "string" ? identifier : null;
  }

  async wake(connection: OpnsenseConnection, interfaceKey: string, mac: string) {
    return mutate(connection, "wol/wol/set", { wake: { interface: interfaceKey, mac } });
  }

  async addDnsName(
    connection: OpnsenseConnection,
    input: { hostname: string; domain: string; ip: string; description: string },
  ) {
    await mutate(connection, "unbound/settings/add_host_override", {
      host: {
        enabled: "1",
        hostname: input.hostname,
        domain: input.domain,
        rr: input.ip.includes(":") ? "AAAA" : "A",
        server: input.ip,
        description: input.description,
      },
    });
    await mutate(connection, "unbound/service/reconfigure", {}, RELOAD_TIMEOUT_MS);
  }

  /** All Unbound host overrides (A/AAAA only; aliases and MX/TXT skipped). */
  async listDnsNames(connection: OpnsenseConnection): Promise<DnsName[]> {
    const payload = await opnsenseRequest<{ rows?: Row[] }>(connection, "unbound/settings/search_host_override", {
      body: { current: 1, rowCount: 2000, sort: {} },
    });
    return (payload.rows ?? [])
      .filter((row) => !row.isAlias && ["A", "AAAA"].includes(String(row.rr ?? "A")))
      .map((row) => ({
        uuid: String(row.uuid),
        enabled: String(row.enabled) === "1",
        hostname: String(row.hostname ?? ""),
        domain: String(row.domain ?? ""),
        ip: String(row.server ?? ""),
        description: String(row.description ?? ""),
      }));
  }

  async updateDnsName(
    connection: OpnsenseConnection,
    uuid: string,
    input: { hostname: string; domain: string; ip: string; description: string },
  ) {
    await mutate(connection, `unbound/settings/set_host_override/${encodeURIComponent(uuid)}`, {
      host: {
        hostname: input.hostname,
        domain: input.domain,
        rr: input.ip.includes(":") ? "AAAA" : "A",
        server: input.ip,
        description: input.description,
      },
    });
    await mutate(connection, "unbound/service/reconfigure", {}, RELOAD_TIMEOUT_MS);
  }

  async deleteDnsName(connection: OpnsenseConnection, uuid: string) {
    await mutate(connection, `unbound/settings/del_host_override/${encodeURIComponent(uuid)}`);
    await mutate(connection, "unbound/service/reconfigure", {}, RELOAD_TIMEOUT_MS);
  }

  // ---------------------------------------------------- website filtering
  // Unbound DNSBL policies for clients in source_nets (empty = every client):
  // "blocklists" match the exact name, "wildcards" only its subdomains, so a
  // site needs both.

  async listSitePolicies(connection: OpnsenseConnection): Promise<SitePolicy[]> {
    const search = await opnsenseRequest<{ rows?: Row[] }>(connection, "unbound/settings/search_dnsbl", {
      body: { current: 1, rowCount: 500 },
    });
    const ours = (search.rows ?? []).filter((row) => String(row.description ?? "").startsWith(SITE_POLICY_PREFIX));
    return Promise.all(
      ours.map(async (row) => {
        const uuid = String(row.uuid);
        const item = await opnsenseRequest<{ blocklist?: Row }>(connection, `unbound/settings/get_dnsbl/${uuid}`, {
          method: "GET",
        });
        const policy = item.blocklist ?? {};
        return {
          uuid,
          description: String(policy.description ?? row.description ?? ""),
          enabled: String(policy.enabled) === "1",
          sourceNets: multiValues(policy.source_nets),
          blocklists: multiValues(policy.blocklists),
          wildcards: multiValues(policy.wildcards),
          allowlists: multiValues(policy.allowlists),
        };
      }),
    );
  }

  /** Creates (uuid null) or replaces a Home Hub policy. Call applySitePolicies after. */
  async saveSitePolicy(connection: OpnsenseConnection, uuid: string | null, input: SitePolicyInput) {
    const blocklist = {
      enabled: input.enabled ? "1" : "0",
      description: input.description,
      type: "", // no remote lists; those stay in your own policies
      lists: "",
      blocklists: input.blocklists.join(","),
      wildcards: input.wildcards.join(","),
      allowlists: input.allowlists.join(","),
      source_nets: input.sourceNets.join(","),
      address: "",
      nxdomain: "0",
    };
    if (uuid) {
      await mutate(connection, `unbound/settings/set_dnsbl/${encodeURIComponent(uuid)}`, { blocklist });
      return uuid;
    }
    const result = await mutate<{ uuid?: string }>(connection, "unbound/settings/add_dnsbl", { blocklist });
    return String(result.uuid);
  }

  async deleteSitePolicy(connection: OpnsenseConnection, uuid: string) {
    await mutate(connection, `unbound/settings/del_dnsbl/${encodeURIComponent(uuid)}`);
  }

  /** Rebuilds Unbound's blocklist from config (remote lists come from cache). */
  async applySitePolicies(connection: OpnsenseConnection) {
    await mutate(connection, "unbound/service/dnsbl", {}, RELOAD_TIMEOUT_MS);
  }

  async addDhcpReservation(
    connection: OpnsenseConnection,
    input: { hostname?: string; ip: string; mac: string; description: string },
  ) {
    await mutate(connection, "dnsmasq/settings/add_host", {
      host: {
        host: input.hostname ?? "",
        ip: input.ip,
        hwaddr: input.mac,
        descr: input.description,
      },
    });
    await mutate(connection, "dnsmasq/service/reconfigure", {}, RELOAD_TIMEOUT_MS);
  }
}

export const networkControlService = new NetworkControlService();
