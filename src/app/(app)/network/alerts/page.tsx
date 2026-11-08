import { Bell } from "lucide-react";

import { AlertsClient } from "./alerts-client";

export default function NetworkAlertsPage() {
  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-red-500">
          <Bell className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground text-sm">
            New devices, gateway problems, quotas and router issues detected by the collector.
          </p>
        </div>
      </div>

      <AlertsClient />
    </main>
  );
}
