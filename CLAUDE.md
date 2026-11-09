@AGENTS.md

# Home Hub

Next.js 16 (App Router) + Prisma 6 on MongoDB (replica set) + Auth.js v5, pnpm.
The network module manages an OPNsense router; its design and per-phase notes
are in [docs/network-opnsense-design.md](docs/network-opnsense-design.md).

## Development (devcontainer)

The app runs in the devcontainer `home-hub_devcontainer-app-1` (Linux,
`/workspaces/home-hub`, MongoDB replica set at `mongo:27017`). The repo,
including `node_modules`, is bind-mounted from the host.

- **Run every pnpm command inside the container.** Running pnpm on a
  macOS host, even `pnpm typecheck`, reinstalls native packages for darwin
  (Next SWC, lightningcss, sharp) and breaks the running dev server. If that
  happens: `pnpm install --force` inside the container, then restart `pnpm dev`.
  ```bash
  docker exec -u node -w /workspaces/home-hub home-hub_devcontainer-app-1 pnpm typecheck
  ```
- Dev server: `NETWORK_COLLECTOR=embedded pnpm dev` (port 3000), or plain
  `pnpm dev` plus `pnpm collector` in a second terminal.
- **After a Prisma schema change**: `pnpm db:gen` (and `pnpm db:push`), then
  **restart the dev server**. `src/lib/db/index.ts` caches the Prisma client
  on `global`, so hot reload keeps the old client ("Unknown argument …").
- `prisma db push` drops indexes Prisma doesn't know about, including the TTL
  indexes in `src/lib/network/collector/collections.ts`. The collector
  re-creates them within 2 minutes; don't add TTLs in `schema.prisma`.
- Prisma on MongoDB stores omitted optional fields as *missing*, and
  `field: null` doesn't match them. Write explicit nulls on create or query with
  `unset()` from `src/lib/network/alerts.ts`.
- Changes to the router go through `src/lib/services/network-control.service.ts`
  and must be audited (`networkAuditService.track`). Never call
  `firewall/alias/reconfigure` per change: it reloads the whole firewall and
  stalls the router API for about a minute.
- Website filtering (`src/lib/network/site-filter.ts`) edits Unbound DNSBL policies
  named `home-hub-sites: …`. Each sync makes the router rebuild its whole
  blocklist (~1 min), so keep syncs serialized (`syncSiteFilter`) and never
  touch policies without that prefix or owned by another account.
- Scripts that use `getAppDb()` must call `closeAppDb()` before exiting, or
  Node keeps running.
- Network control actions require `role = ADMIN` (`requireManager()` in
  `src/lib/network/action-helpers.ts`); reads only need a session.

## Production deployment (Docker Compose)

`docker-compose.yaml` is a production example: MongoDB 7 replica set, a
one-shot `schema` (Dockerfile `schema` stage: `prisma db push`), and the Next.js
standalone `app` (Dockerfile `runner` stage) with the network collector
embedded.

1. Create `.env.production` from `.env.sample` (it's gitignored and never
   copied into images). Required:
   - `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and `NEXTAUTH_URL`
     (public URL + `/api/auth`, e.g. `https://hub.example.com/api/auth`)
   - `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` (OAuth sign-in)
   - `ADMIN_EMAILS`: accounts registered with these emails become ADMIN
   - Optional: `RESEND_API_KEY` + `HOME_HUB_EMAIL_FROM` (sender on a domain
     verified in Resend) for alert and account emails;
     `NETWORK_SECRET_KEY` (encrypts router API secrets, defaults to
     `NEXTAUTH_SECRET`; changing it later means re-entering the router secret)

   `DATABASE_URL`, `NETWORK_COLLECTOR=embedded`, `AUTH_TRUST_HOST` and
   `PRISMA_LOG_QUERIES` are set by the compose file. Set `TZ` (e.g.
   `TZ=America/Edmonton docker compose up -d`) so schedules and "today" use
   your local day.
2. Start: `docker compose up -d --build`. `mongo-init` creates replica set
   `rs0`, `schema` pushes the schema, then `app` starts on port 3000.
   `docker compose logs -f app` should show `[collector] started` and
   `acquired lease`.
3. In the app: Settings → Network → router URL, API key and secret. Then
   Router control → *Prepare router* to enable MAC blocking, pause,
   schedules and quarantine.
4. Upgrades: `git pull && docker compose up -d --build` (re-runs `schema`).
   There are no data migrations; schema changes are applied by `prisma db push`.
5. Prebuilt images: CI (`.github/workflows/docker-publish.yml`) publishes
   `ghcr.io/hareeshbabu82ns/home-hub` (app) and `…/home-hub-schema` for
   `v*.*.*` tags. To deploy without building, swap the `build:` blocks in
   `docker-compose.yaml` for the commented `image:` lines, then
   `docker compose pull && docker compose up -d`.

Notes:
- The Docker host must reach the router's API (OPNsense URL from Settings).
- Put a reverse proxy (TLS) in front of port 3000. Blocking-yourself
  protection uses `X-Forwarded-For`, so forward it.
- MongoDB has no auth and isn't published outside the compose network. Enabling
  auth on a replica set also needs a keyfile. With auth, give the app's user
  `readWrite` **and** `dbAdmin` on its database: the collector changes
  time-series retention with `collMod` (without `dbAdmin` it logs a warning
  and keeps the old retention).
- Back up the `mongo-data` volume (`mongodump`). It holds users, device
  inventory, history and settings.
- ```sh
  mongosh -u <admin-user> -p --authenticationDatabase admin --eval 'db.getSiblingDB("hhub").grantRolesToUser("hhub", [{ role: "dbAdmin", db: "hhub" }])'
  ```