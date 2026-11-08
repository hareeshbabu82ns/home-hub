import { Gauge } from "lucide-react";

import { RouterHealthClient } from "./router-health-client";

export default function NetworkRouterPage() {
  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-cyan-500">
          <Gauge className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Router</h1>
          <p className="text-muted-foreground text-sm">
            Health, gateways and WAN throughput recorded by the collector.
          </p>
        </div>
      </div>

      <RouterHealthClient />
    </main>
  );
}
