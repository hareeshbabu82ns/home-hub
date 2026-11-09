/**
 * Runs once per Next.js server instance. Starts the network collector inside
 * the server when NETWORK_COLLECTOR=embedded (the production Docker image runs
 * only `server.js`, so this is how the collector runs there). In development
 * you can run it separately with `pnpm collector` instead; a lease ensures
 * only one collector works at a time.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NETWORK_COLLECTOR !== "embedded"
  ) {
    return;
  }

  const globalForCollector = globalThis as unknown as {
    networkCollectorStarted?: boolean;
  };
  if (globalForCollector.networkCollectorStarted) return;
  globalForCollector.networkCollectorStarted = true;

  const { startNetworkCollector } = await import("@/lib/network/collector");
  // Don't hold up server start-up (register must finish before requests are
  // served), and never crash the server if the collector can't start.
  void startNetworkCollector().catch((error) => {
    globalForCollector.networkCollectorStarted = false;
    console.error("[collector] failed to start:", error);
  });
}
