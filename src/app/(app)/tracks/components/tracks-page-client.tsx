"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchTrackItems, getTrackingMetrics } from "../actions";
import type {
  TrackItemWithAttributes,
  TrackItemFilter,
  TrackingMetrics,
} from "@/types/track";
import { TrackFilter } from "./track-filter";
import { TrackingCharts } from "./tracking-charts";
import Link from "next/link";
import { SquarePen as NewTrackIcon, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function TracksPageClient() {
  const [tracks, setTracks] = useState<TrackItemWithAttributes[]>([]);
  const [metrics, setMetrics] = useState<TrackingMetrics | null>(null);
  const [filters, setFilters] = useState<TrackItemFilter>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tracksData, metricsData] = await Promise.all([
        fetchTrackItems(filters),
        getTrackingMetrics(),
      ]);
      setTracks(tracksData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Error loading tracks:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: TrackItemFilter) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading tracks...</div>
      </div>
    );
  }

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Track</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/tracks/analytics">
              <BarChart3 className="mr-2 size-4" />
              Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tracks/new">
              <Plus className="mr-2 size-4" />
              New Track
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && <TrackingCharts metrics={metrics} />}

      {/* Filters */}
      <TrackFilter
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Track Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Track Items ({tracks.length})</CardTitle>
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

function TrackItemTable({ tracks }: { tracks: TrackItemWithAttributes[] }) {
  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">No tracks found.</p>
        <Button asChild>
          <Link href="/tracks/new">Create your first track</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-4 text-left font-medium">Title</th>
            <th className="p-4 text-left font-medium">Description</th>
            <th className="p-4 text-left font-medium">Attributes</th>
            <th className="p-4 text-left font-medium">Last Updated</th>
            <th className="p-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id} className="hover:bg-muted/25 border-b">
              <td className="p-4">
                <Link
                  href={`/tracks/${track.id}`}
                  className="font-medium hover:underline"
                >
                  {track.title}
                </Link>
              </td>
              <td className="text-muted-foreground p-4">
                {track.description || "No description"}
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {track.TrackAttributes.slice(0, 3).map((attr) => (
                    <Badge
                      key={attr.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {attr.title}
                    </Badge>
                  ))}
                  {track.TrackAttributes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{track.TrackAttributes.length - 3} more
                    </Badge>
                  )}
                  {track.TrackAttributes.length === 0 && (
                    <span className="text-muted-foreground text-sm">
                      No attributes
                    </span>
                  )}
                </div>
              </td>
              <td className="text-muted-foreground p-4 text-sm">
                {formatDistanceToNow(new Date(track.updatedAt), {
                  addSuffix: true,
                })}
              </td>
              <td className="p-4 text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/tracks/${track.id}`}>View</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
