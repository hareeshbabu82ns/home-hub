import Link from "next/link";
import { fetchTrackItems, getTrackingMetrics } from "./actions";
import { SquarePen as NewTrackIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackingCharts } from "./components/tracking-charts";
import { TrackItemTable } from "./components/track-item-table";

export default async function TracksPage() {
  const [tracks, metrics] = await Promise.all([
    fetchTrackItems(),
    getTrackingMetrics(),
  ]);

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Track</h1>
        <div className="flex gap-2">
          {/* <Button asChild variant="outline">
            <Link href="/tracks/analytics">
              <BarChart3 className="mr-2 size-4" />
              Analytics
            </Link>
          </Button> */}
          <Button asChild>
            <Link href="/tracks/new">
              <Plus className="mr-2 size-4" />
              New Track
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <TrackingCharts metrics={metrics} />

      {/* Track Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Track Items</CardTitle>
            <Button asChild size="sm">
              <Link href="/tracks/new">
                <NewTrackIcon className="mr-2 size-4" />
                New Track
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TrackItemTable tracks={tracks} />
        </CardContent>
      </Card>
    </main>
  );
}
