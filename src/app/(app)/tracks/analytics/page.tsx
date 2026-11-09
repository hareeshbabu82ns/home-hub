import { getTrackingMetrics } from "../actions";
import { TrackingCharts } from "../components/tracking-charts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage() {
  const metrics = await getTrackingMetrics();

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/tracks">
            <ArrowLeft className="mr-2 size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Tracking Analytics</h1>
      </div>

      <TrackingCharts metrics={metrics} />
    </main>
  );
}
