import { Activity } from "lucide-react";
import { TrafficMonitorClient } from "./traffic-monitor-client";

export default function NetworkTrafficPage() {
  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-500">
          <Activity className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Network Traffic</h1>
          <p className="text-muted-foreground text-sm">
            Live LAN traffic over time from your router diagnostics API.
          </p>
        </div>
      </div>

      <TrafficMonitorClient />
    </main>
  );
}
