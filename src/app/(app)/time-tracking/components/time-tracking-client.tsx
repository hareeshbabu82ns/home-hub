"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Star, Grid3X3, List, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicCard } from "./topic-card";
import { TopicDialog, AddTopicCard } from "./topic-dialog";
import {
  useTimerSync,
  formatDurationShort,
  formatTime,
} from "../hooks/use-timer-sync";
import {
  getTodayDuration,
  getWeekDuration,
  getTotalDuration,
} from "@/lib/time-tracking-utils";
import type {
  DurationBreakdown,
  TimeTopicWithSessions,
} from "@/types/time-tracking";
import { stopTopicTimer } from "../actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TimeTrackingClientProps {
  initialTopics: TimeTopicWithSessions[];
}

export function TimeTrackingClient({ initialTopics }: TimeTrackingClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [editingTopic, setEditingTopic] =
    useState<TimeTopicWithSessions | null>(null);

  const handleTimerUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  const { timers, startTimer, stopTimer, getRunningTimers } = useTimerSync({
    topics: initialTopics,
    onTimerUpdate: handleTimerUpdate,
  });

  const runningTimers = getRunningTimers();
  const filteredTopics =
    filter === "favorites"
      ? initialTopics.filter((t) => t.isFavorite)
      : initialTopics;

  // Calculate totals from breakdown
  const totalToday = initialTopics.reduce(
    (sum, t) =>
      sum +
      getTodayDuration(t.durationBreakdown as unknown as DurationBreakdown),
    0,
  );
  const totalWeek = initialTopics.reduce(
    (sum, t) =>
      sum +
      getWeekDuration(t.durationBreakdown as unknown as DurationBreakdown),
    0,
  );
  const totalAllTime = initialTopics.reduce(
    (sum, t) =>
      sum +
      getTotalDuration(t.durationBreakdown as unknown as DurationBreakdown),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-linear-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/20">
              <Clock className="size-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Active Timers</p>
              <p className="text-2xl font-bold">{runningTimers.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <Clock className="size-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Today</p>
              <p className="text-2xl font-bold">
                {formatDurationShort(totalToday)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Clock className="size-6 text-amber-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">This Week</p>
              <p className="text-2xl font-bold">
                {formatDurationShort(totalWeek)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/20">
              <Clock className="size-6 text-rose-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">All Time</p>
              <p className="text-2xl font-bold">
                {formatDurationShort(totalAllTime)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Timers Banner */}
      {runningTimers.length > 0 && (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-3 animate-pulse rounded-full bg-emerald-500" />
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
              </div>
              <p className="text-sm font-medium">
                {runningTimers.length} timer
                {runningTimers.length > 1 ? "s" : ""} running
              </p>
            </div>

            {/* Active Timers List */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {initialTopics
                .filter((t) => timers.has(t.id))
                .map((topic) => {
                  const timerState = timers.get(topic.id);
                  if (!timerState) return null;

                  const handleStop = () => {
                    stopTimer(topic.id);
                    const formData = new FormData();
                    formData.append("topicId", topic.id);
                    if (timerState.sessionId) {
                      formData.append("sessionId", timerState.sessionId);
                    }
                    stopTopicTimer({ message: "", success: false }, formData)
                      .then(() => {
                        toast.success("Timer stopped");
                      })
                      .catch((error) => {
                        toast.error(error?.message || "Failed to stop timer");
                      });
                  };

                  return (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{topic.name}</p>
                        <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatTime(timerState.elapsedMs)}
                        </p>
                      </div>
                      <button
                        onClick={handleStop}
                        className="ml-2 flex size-10 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:scale-110 active:scale-95"
                      >
                        <Square className="size-5 fill-white" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as "all" | "favorites")}
        >
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Grid3X3 className="size-4" />
              All Topics
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="size-4" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Topics Grid/List */}
      {filteredTopics.length === 0 && filter === "favorites" ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="text-muted-foreground/50 size-12" />
            <p className="text-muted-foreground mt-4">No favorite topics yet</p>
            <p className="text-muted-foreground text-sm">
              Star a topic to add it to your favorites
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-4",
          )}
        >
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              timerState={timers.get(topic.id)}
              onTimerStart={startTimer}
              onTimerStop={stopTimer}
              onEdit={setEditingTopic}
            />
          ))}
          {filter === "all" && <AddTopicCard />}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTopic && (
        <TopicDialog
          topic={editingTopic}
          open={!!editingTopic}
          onOpenChange={(open) => !open && setEditingTopic(null)}
        />
      )}
    </div>
  );
}
