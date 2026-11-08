# Network monitoring & control for OPNsense — validation, use cases, design

Status: proposal · Date: 2026-11-08 · Scope: `src/app/(app)/network/**`, `src/lib/services/network-*`, `src/lib/actions/network.ts`

## 1. Validation of what exists today

Validated against the running app (devcontainer, real OPNsense router, 36 devices) and the OPNsense core source (`opnsense/core` master).

| # | Area | Finding | Evidence | Status |
|---|------|---------|----------|--------|
| V1 | Device DNS view | `unbound/overview/search_queries` ignores `client` unless `timeStart`/`timeEnd` are also sent, and has no `action` filter. The device page showed **every client's** last 1000 queries (rows from .190, .97, .213… on the page for .125). | Live response; `OverviewController::searchQueriesAction` | **Fixed**: `searchPhrase` = IP on the router, exact `client`/`action` filter + paging in the app |
| V2 | Traffic page | `diagnostics/traffic/top/lan` takes 2.6–3.7 s (the router samples before replying). The page fired every 1 s; server actions run serially, so calls queued without bound (5 completed in 17 s, data increasingly stale). Badge claimed "1s refresh". | Browser timings | **Fixed**: in-flight guard, back-to-back polling with 1 s gap, paused when tab hidden, real cadence shown |
| V3 | Traffic chart | Charted the first 8 addresses ever seen, not the busiest. | Code | **Fixed**: top 8 by peak rate in window |
| V4 | TLS | `verifyTls=false` was implemented by toggling `process.env.NODE_TLS_REJECT_UNAUTHORIZED` around each call — racy, and disabled cert checks for *all* concurrent outbound requests (email, Appwrite). | Code | **Fixed**: per-request undici `Agent` (`src/lib/services/opnsense-client.ts`), plus 15 s timeouts |
| V5 | Block status | Status was read from the alias **config** (`alias/search_item` → `content`), blocking writes via `alias_util` (config **and** pf table for `host` aliases, pf table only for `external`). With an External alias the UI could never show "Blocked". | `AliasUtilController` | **Fixed**: read the live pf table (`alias_util/list/Blocked_Devices`), fall back to config; `status != done` now surfaces as an error |
| V6 | Resilience | If the router was unreachable, the whole device list (stored in Mongo) failed to load. | Code | **Fixed**: list loads, warning toast "block status may be out of date" |
| V7 | Scan subnet | `search_arp` has no `subnet` parameter; the "subnet override" input did nothing. | `InterfaceController::searchArpAction` | **Fixed**: CIDR filter applied in the app |
| V8 | Device type | ARP `type` ("ethernet") was stored as `deviceType`, and every scan overwrote the user's edited type. | All 36 rows show "ethernet" | **Fixed** for future scans; existing rows still say "ethernet" |
| V9 | Identity | Devices are keyed by `(userId, ipAddress)`. A DHCP renumbering creates a duplicate device and moves the old device's name/notes/block onto whichever host now has that IP. Blocking is by IP, so a blocked device escapes by getting a new lease. | Schema `@@unique([userId, ipAddress])` | Open → §4.2 |
| V10 | Names | All 36 devices are "Unknown": ARP is queried with `resolve: "no"` and ARP carries no DHCP hostname. | Live page | Open → use DHCP leases (§4.1) |
| V11 | Scope | WAN-side ARP entries (ISP gateway `10.25.42.1`) are listed and offered a "Block" button. | Live page | Open → classify infrastructure, hide/guard (§4.5) |
| V12 | Randomised MACs | ≥5 devices use locally administered (private) MACs (`b2:`, `16:`, `6a:`, `72:`, `76:`). Stable per-network on iOS/Android by default, but rotate on "forget network" or periodic-rotation settings. | Live page | Open → flag in UI (§4.2) |
| V13 | Secrets | API secret stored plaintext in Mongo; `apiKey` returned to the browser on the settings page. Any logged-in user role can block devices. | Code | Open → §4.6 |
| V14 | Polling cost | Every traffic poll also re-reads the device table from Mongo just for names. | Code | Open → collector cache (§4.3) |

Prerequisite that the app does not check today: a firewall rule on LAN must reference `Blocked_Devices` (block, source = alias). Without it, "Block" adds the IP to a table that nothing enforces. The setup check in §4.4 covers this.

## 2. Refined use cases

Priorities: **P0** fix trust in existing data, **P1** core monitoring, **P2** control, **P3** nice-to-have.

### A. Inventory & identity
- **A1 (P0)** Know every device by a stable identity (MAC), with all IPs it has used and when.
- **A2 (P0)** Show real names: DHCP lease hostname → user label → vendor (OUI) → IP.
- **A3 (P1)** Flag *new* devices (first time a MAC is seen) and *changed* devices (same IP, different MAC = possible spoof/replacement).
- **A4 (P1)** Group devices (Family, Kids, IoT, Work, Guests, Infrastructure) and set owner, type and icon.
- **A5 (P2)** Pin a device's IP by creating a DHCP reservation from the device page.

### B. Presence & alerts
- **B1 (P1)** Online/offline state and history per device (who is home, when the TV was last on).
- **B2 (P1)** Alerts: new device joined, a blocked device seen on the network, a device on WAN/unknown interface, gateway down, WAN latency/loss over threshold, a device exceeding a daily data quota.
- **B3 (P3)** Notify via email (Resend is already a dependency) or web push (PWA).

### C. Traffic & usage
- **C1 (P1)** Live top talkers per interface (LAN, VLANs, WAN), not just `lan`.
- **C2 (P1)** Per-device usage history: hourly/daily bytes in/out, 30-day trend, "top consumers this week".
- **C3 (P1)** WAN throughput and gateway quality (RTT, loss) over time.
- **C4 (P2)** Active connections for a device (pf states: remote host, port, bytes) with the option to kill a state.

### D. DNS insight & filtering
- **D1 (P0)** Per-device DNS log that is actually per device (fixed, V1).
- **D2 (P1)** Per-device top domains, block rate, and "first time this device contacted domain X".
- **D3 (P2)** Per-group DNS policy (Unbound blocklist policies), e.g. stricter lists for Kids/IoT.
- **D4 (P2)** Local DNS names: create an Unbound host override (`tv.home` → device IP) from the device page.

### E. Access control
- **E1 (P0)** Block/unblock that cannot be evaded by a new DHCP lease (MAC-based alias).
- **E2 (P2)** Scheduled access: Kids group offline 22:00–07:00 on school nights, and "pause internet for 1 hour".
- **E3 (P2)** Quarantine new devices (internet-only or no access) until reviewed.
- **E4 (P2)** IoT isolation report: which IoT devices talk to which LAN hosts (needs firewall log).
- **E5 (P0)** Safety rails: can't block the router, its gateway, the device running Home Hub, or the admin's current device without explicit override.

### F. Router health & operations
- **F1 (P1)** Router dashboard: CPU, memory, disk, temperature, uptime, firmware, interface status/errors, gateway status.
- **F2 (P2)** Wake-on-LAN a device (os-wol plugin).
- **F3 (P2)** Reconfigure services (Unbound, filter) and reboot, behind confirmation.
- **F4 (P1)** Audit log of every control action (who, what, when, router response).

## 3. OPNsense API mapping

Confirmed in OPNsense core/plugins source unless marked *(unconfirmed)*. Paths are `/api/<module>/<controller>/<action>`.

| Use case | Endpoint | Notes |
|---|---|---|
| A1, B1 | `diagnostics/interface/search_arp`, `search_ndp` | ARP (v4) and NDP (v6) neighbours, includes `intf_description`. |
| A2, A5 | `kea/leases4/search` or `dnsmasq/leases/search` | Which one depends on the router's DHCP server (open question 1). Lease rows carry hostname + MAC. Kea `leases` is abstract; the concrete controller is per-family *(path unconfirmed)*. |
| A5 | Kea / Dnsmasq reservation `add_*` + `reconfigure` *(unconfirmed)* | |
| C1 | `diagnostics/traffic/top/{lan,opt1,...}` | Comma-separated interface keys; ~2–4 s per call. |
| C1, C3 | `diagnostics/traffic/interface`, `diagnostics/traffic/stream` (SSE) | Interface byte counters; stream is ideal for the collector. |
| C3, B2 | `routes/gateway/status` | Gateway up/down, RTT, loss. |
| C4 | `diagnostics/firewall/query_states` (POST), `del_state/{id}/{creator}` | |
| D1, D2 | `unbound/overview/search_queries`, `totals/{n}`, `rolling/{period}/{clients}` | `client` filter only with a time range; see V1. |
| D3 | `unbound/overview/get_policies`; Unbound DNSBL settings | Policies per source network. |
| D4 | `unbound/settings/add_host_override` + Unbound service reconfigure *(controller unconfirmed)* | |
| E1, E2, E3 | `firewall/alias/*` (`add_item`, `set_item`, `get_alias_u_u_i_d`, `reconfigure`), `firewall/alias_util/{add,delete,list,flush}` | Alias type `mac` exists. `alias_util` persists only for `host`/`network` aliases. |
| E1 setup | `firewall/filter/add_rule`, `toggle_rule`, `search_rule`; `savepoint` / `apply` / `revert` *(in FilterBaseController, unconfirmed)* | Use savepoint+apply so a bad rule auto-reverts after 60 s. |
| E4 | `diagnostics/firewall/log`, `stats` | |
| F1 | `diagnostics/system/{system_information,system_resources,system_temperature,system_disk}`, `interfaces/overview/interfaces_info` | |
| F2 | `wol/wol/set` (plugin `os-wol`) | POST `{wake: {interface, mac}}` or `uuid`. |
| F3 | `core/system/reboot`, service `reconfigure` endpoints | |

## 4. Design

### 4.1 Architecture

```
            ┌──────────── OPNsense ─────────────┐
            │ ARP/NDP · leases · traffic · DNS  │
            │ pf tables · aliases · rules       │
            └───────▲───────────────▲───────────┘
          read (poll/SSE)       write (reconcile)
                    │               │
┌───────────────────┴──┐   ┌────────┴──────────────┐
│ collector (worker)    │   │ policy reconciler     │
│ tsx scripts/network-  │──▶│ desired state in DB → │
│ collector.ts          │   │ aliases/rules on router│
└──────────┬────────────┘   └────────┬──────────────┘
           │ writes                   │ audit
           ▼                          ▼
     MongoDB: devices, addresses, presence, traffic (time-series),
              dns aggregates, policies, alerts, audit, router snapshots
           ▲
           │ reads (server actions) + SSE route for live views
     Next.js app (/network/*)
```

- **Collector**: a separate long-running Node process (one more service in `docker-compose.yaml` running the same image with `tsx scripts/network-collector.ts`). Next.js has no reliable place for background jobs. `instrumentation.ts` timers would run in every server instance and restart on HMR. Cadence: ARP/NDP + leases every 30 s, `traffic/top` continuously (one call at a time), interface counters via `traffic/stream`, gateway status 30 s, system resources 60 s, DNS log every 60 s (incremental by `time`).
- **Live views** read the collector's latest snapshot from Mongo (or an in-memory cache exposed via an SSE route handler `app/api/network/live/route.ts`). Many browser tabs then share one router poll, which removes V2/V14 by construction.
- **Reads vs writes**: pages never call the router to *read* once the collector exists. Only control actions call the router synchronously, through the reconciler.
- The single `opnsenseRequest` client (added in this change) is the only way to reach the router. Next: add a capability probe (`firmware` version, installed plugins, DHCP backend) stored with the connection.

### 4.2 Data model (Prisma, MongoDB)

Identity moves from IP to MAC. Existing `NetworkDevice` rows migrate by their `macAddress`.

```prisma
model NetworkDevice {            // one per physical device (MAC)
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId          // later: siteId for multi-router
  macAddress    String                          // normalised lower-case
  isRandomMac   Boolean  @default(false)        // locally administered bit
  name          String?                         // user label
  dhcpHostname  String?
  vendor        String?
  deviceType    String?                         // user-owned category
  groupId       String?  @db.ObjectId
  role          DeviceRole @default(CLIENT)     // CLIENT | INFRASTRUCTURE | APP_HOST
  status        DeviceStatus @default(NEW)      // NEW | KNOWN | QUARANTINED
  currentIp     String?
  currentIntf   String?
  online        Boolean  @default(false)
  firstSeenAt   DateTime
  lastSeenAt    DateTime
  notes         String?
  @@unique([userId, macAddress])
  @@index([userId, currentIp])
}

model DeviceAddress {            // IP history
  deviceId String @db.ObjectId
  ip       String
  family   String                // ip4 | ip6
  intf     String?
  firstSeenAt DateTime
  lastSeenAt  DateTime
  @@unique([deviceId, ip])
}

model DeviceGroup  { id, userId, name, color, policyId? }
model AccessPolicy {             // desired state, reconciled to the router
  id, userId, name,
  kind        PolicyKind         // BLOCK | SCHEDULE | QUARANTINE | DNS_PROFILE
  schedule    Json?              // [{days:[1-5], from:"22:00", to:"07:00"}]
  pausedUntil DateTime?
  aliasName   String             // e.g. HH_Block, HH_Kids_Schedule
  members     → devices/groups
}
model PresenceEvent { deviceId, at, online: Boolean }
model Alert         { id, userId, kind, deviceId?, message, createdAt, readAt? }
model AuditLog      { id, userId, actor, action, target, request Json, result Json, at }
```

High-volume series go into native **MongoDB time-series collections**, created by a setup script with the `mongodb` driver (Prisma can't declare them) and read via `db.$runCommandRaw` or the driver:

| Collection | Granularity | Retention | Size (≈40 devices) |
|---|---|---|---|
| `traffic_samples` {deviceMac, intf, bitsIn, bitsOut} | ~5 s | 48 h | ~1.4 M docs, small |
| `traffic_hourly` {deviceMac, bytesIn, bytesOut} | 1 h | 400 d | ~350 k docs |
| `dns_hourly` {deviceMac, domain, action, count} | 1 h | 90 d | depends on domains, cap top-N per hour |
| `router_health` {cpu, mem, temp, gw rtt/loss, wan bps} | 30–60 s | 30 d | |

Traffic rows from `top` are by IP. The collector resolves IP→MAC with the ARP snapshot taken in the same cycle before writing.

### 4.3 Monitoring flows

- **Discovery** (A1–A3): ARP ∪ NDP ∪ leases → upsert by MAC → write `DeviceAddress` → raise `NEW_DEVICE` the first time a MAC is seen, and `IP_CONFLICT` when an IP's MAC changes inside 10 min.
- **Presence** (B1): online = seen in ARP (non-expired) or lease active in the last 2 cycles. Emit `PresenceEvent` only on a state change.
- **Usage** (C2): `traffic_samples` → hourly rollup job → daily quota check → `QUOTA_EXCEEDED` alert.
- **DNS** (D2): incremental pull of `search_queries` (max `time` watermark) → aggregate per MAC/domain/hour. This keeps history beyond the router's 1000-row window.

### 4.4 Control model (desired state → reconcile)

1. **One-time setup wizard** (Settings → Network → "Prepare router"), using a savepoint:
   - create aliases `HH_Block` (type **mac**) and `HH_Schedule_*` (mac), plus `HH_AppHost` (host).
   - create LAN rules at the top: *block, source = HH_Block, any destination* (and IPv6), logging on.
   - `apply` with rollback. The wizard shows what it will create and needs explicit confirmation. Re-running it is idempotent: match by alias name / rule description `home-hub:*`.
2. **Block (E1)**: add the MAC to `HH_Block` via `alias/set_item` + `alias/reconfigure`. A MAC alias follows the device across IPs. Kill the device's existing pf states so the block takes effect immediately. Keep the current IP alias `Blocked_Devices` working until migration.
3. **Schedules / pause (E2)**: the reconciler computes "should be blocked now" for each policy every minute and toggles membership in the schedule alias. This is simpler and more visible than OPNsense's legacy schedules, and survives router reboots because membership is persisted in config.
4. **Quarantine (E3)**: new MACs go into `HH_Quarantine` (rule: allow DNS + internet only, or nothing) until marked reviewed.
5. Every control call writes an `AuditLog` row with the router's response. Failures leave desired state unchanged and show "out of sync" with a Retry button. The reconciler also detects drift (alias edited on the router by hand).

### 4.5 Safety rails (E5)
- `role = INFRASTRUCTURE` for the router's own interfaces, its gateways (`routes/gateway/status`), and anything on a WAN interface. These are hidden from the default list and have no Block button.
- `role = APP_HOST` for the Home Hub host and the requesting client's IP: blocking requires a typed confirmation.
- All destructive actions use a confirm dialog that names the device and its effect, and are rate-limited.

### 4.6 Security
- Encrypt `apiSecret` at rest (AES-256-GCM, key from env `NETWORK_SECRET_KEY`). Never send `apiKey`/`apiSecret` to the browser; the settings form shows "saved" state only.
- Use a dedicated OPNsense user with only the needed privileges: Diagnostics (ARP, traffic, system), Firewall Aliases, Firewall Rules (setup only), Unbound overview, DHCP leases, WoL.
- Gate control actions to `role = ADMIN` in the app (the `User.role` field exists). Read-only users get monitoring only.
- Keep `verifyTls=false` the default only for private IP base URLs; warn otherwise. Allow pinning the router's certificate fingerprint as a better alternative.

### 4.7 UI / information architecture

| Route | Content |
|---|---|
| `/network` (overview) | Online count, new devices, alerts, WAN throughput & gateway health, top 5 consumers today, blocked/paused devices |
| `/network/devices` | Inventory by MAC: name, group, IP, online dot, today's usage, status badges (New, Random MAC, Blocked, Paused). Filters: group, online, interface. Bulk: assign group, block, mark reviewed |
| `/network/devices/[id]` | Tabs: Overview (identity, IP history, presence timeline) · Traffic (live + 30 d) · DNS (log, top domains) · Connections (pf states) · Access (block, schedule, pause, quarantine, DNS profile, WoL, DHCP reservation, DNS name) · Audit |
| `/network/traffic` | Live per-interface top talkers (from collector), interface selector, WAN graph |
| `/network/dns` | Network-wide top domains, top blocked, per-client breakdown |
| `/network/policies` | Groups, schedules, quarantine settings, sync state with the router |
| `/network/alerts` | Alert inbox and notification settings |
| `/network/router` | System resources, temperature, interfaces, gateways, firmware |
| `/settings/network` | Connection, capability check, "Prepare router" wizard, privileges check |

## 5. Roadmap

| Phase | Deliverables | Use cases |
|---|---|---|
| **0 — done in this change** | OPNsense client, V1–V8 fixes | D1 |
| **1 — trustworthy inventory** | MAC identity + migration, DHCP leases for names, NDP, infrastructure classification, random-MAC flag, secret encryption, ADMIN gating | A1–A3, E5, V9–V13 |
| **2 — collector & history** | Worker service, time-series collections, presence, hourly traffic/DNS rollups, SSE live views, router health page | B1, C1–C3, D2, F1 |
| **3 — control** | Setup wizard, MAC block alias, pause/schedule reconciler, quarantine, audit log, WoL, DNS host override, DHCP reservation | E1–E3, A5, D4, F2, F4 |
| **4 — alerts & polish** | Alert engine + email/push, quotas, pf-state view/kill, IoT isolation report, per-group DNS policies | B2–B3, C4, D3, E4 |

## 6. Open questions

1. Which DHCP server does the router run: Kea, Dnsmasq or ISC (legacy)? This decides the leases/reservations API.
2. Are there VLANs (IoT/Guest) beyond `lan`? Traffic and rules must then cover each interface key.
3. Is `Blocked_Devices` currently a **host** or **external** alias, and is a LAN block rule already referencing it?
4. Single router per installation, or should the model be multi-site (`siteId`) from the start?
5. Should non-admin household members get a read-only view (for example, their own devices only)?
