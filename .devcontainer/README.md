# Home Hub Devcontainer

This devcontainer is a clean setup for a Next.js app that uses pnpm and a local MongoDB single-node replica set.

## Services

- app: Node.js 22 development container for the workspace
- mongo: MongoDB 7 with `--replSet rs0`
- mongo-init: one-shot init container that ensures `rs0` is created

## Default Connection String

`mongodb://mongo:27017/home-hub?replicaSet=rs0`

The value is injected through devcontainer `remoteEnv` and compose service environment.

## First Run

1. Rebuild and reopen in container.
2. Wait for `post-create.sh` to finish (`pnpm install` + `pnpm db:gen`).
3. Start the app:

```bash
pnpm dev
```

## Forwarded Ports

- 3000: Next.js dev server
- 27017: MongoDB
- 5555: Prisma Studio
