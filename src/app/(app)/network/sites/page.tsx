import { Globe } from "lucide-react";

import { SitesClient } from "./sites-client";

export default function NetworkSitesPage() {
  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-orange-500">
          <Globe className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
          <p className="text-muted-foreground text-sm">
            Block sites for every device, or per device from its page.
          </p>
        </div>
      </div>

      <SitesClient />
    </main>
  );
}
