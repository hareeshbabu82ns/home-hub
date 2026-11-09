/**
 * Standalone network collector (Phase 2). Run inside the devcontainer:
 *
 *   pnpm collector
 *
 * Alternatively set NETWORK_COLLECTOR=embedded to run it inside the Next.js
 * server (src/instrumentation.ts). Only one collector works at a time.
 */
import "dotenv/config";

// Prisma logs every query by default in this app; that's a flood here.
process.env.PRISMA_LOG_QUERIES ??= "false";

async function main() {
  const { startNetworkCollector } = await import("../src/lib/network/collector");
  const { closeAppDb } = await import("../src/lib/db/mongo-native");
  const collector = await startNetworkCollector();

  const shutdown = async (signal: string) => {
    console.info(`[collector] ${signal} received, stopping`);
    await collector.stop();
    await closeAppDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("[collector] fatal:", error);
  process.exit(1);
});
