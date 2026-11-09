import { ShieldCheck } from "lucide-react";

import { AccessClient } from "./access-client";
import { InternalFlowsCard } from "./internal-flows-card";

export default function NetworkAccessPage() {
  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-amber-500">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Access</h1>
          <p className="text-muted-foreground text-sm">
            Offline schedules, cross-network connections, and a log of every network change.
          </p>
        </div>
      </div>

      <AccessClient />

      <InternalFlowsCard />
    </main>
  );
}
