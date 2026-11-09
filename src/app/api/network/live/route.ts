import { getUserAuth } from "@/lib/auth/utils";
import { networkInsightsService } from "@/lib/services/network-insights.service";

/**
 * Server-sent events with the collector's live traffic snapshot.
 *
 *   event: status   { running, heartbeatAt, lastError }    every 2s
 *   event: traffic  { at, rows: LiveTrafficRow[] }         when it changes
 *
 * Every open page shares the collector's single router poll instead of
 * calling the router itself.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TICK_MS = 2_000;

export async function GET(request: Request) {
  const { session } = await getUserAuth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastTrafficAt: string | null = null;
      let closed = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearTimeout(timer);
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      };

      const tick = async () => {
        try {
          const [status, live] = await Promise.all([
            networkInsightsService.getCollectorStatus(userId),
            networkInsightsService.getLiveTraffic(userId),
          ]);
          send("status", status);
          if (live.at && live.at !== lastTrafficAt) {
            lastTrafficAt = live.at;
            send("traffic", live);
          }
        } catch (error) {
          console.error("[network/live] tick failed", error);
          send("status", { running: false, heartbeatAt: null, lastDiscoveryAt: null, lastError: "Live feed error" });
        }
        if (!closed) timer = setTimeout(() => void tick(), TICK_MS);
      };

      request.signal.addEventListener("abort", close);
      controller.enqueue(encoder.encode("retry: 5000\n\n"));
      void tick();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
