"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimerSync } from "@/app/(app)/time-tracking/hooks/use-timer-sync";
import type { TimeTopicWithSessions } from "@/types/time-tracking";
import {
  startTopicTimer,
  stopTopicTimer,
} from "@/app/(app)/time-tracking/actions";
import { toast } from "sonner";
import { TimeStatsChart } from "@/app/(app)/time-tracking/components/time-stats-chart";
import {
  TimerDisplay,
  TimerButton,
} from "@/app/(app)/time-tracking/components/timer-display";
import { getIconByName } from "@/lib/icons";

interface DashboardTimeTrackingProps {
  initialTopics: TimeTopicWithSessions[];
  frequentTopics: Array<{
    id: string;
    name: string;
    color: string;
    sessionCount: number;
  }>;
  recentTopics: Array<{
    id: string;
    name: string;
    color: string;
    lastTrackedAt?: Date | null;
  }>;
}

export function DashboardTimeTracking({
  initialTopics,
  frequentTopics,
  // recentTopics,
}: DashboardTimeTrackingProps) {
  const { timers, startTimer, stopTimer, getRunningTimers } = useTimerSync({
    topics: initialTopics,
    onTimerUpdate: () => {
      // no-op, dashboard can be refreshed by parent
    },
  });

  const [search, setSearch] = React.useState("");

  const running = getRunningTimers();

  const filteredFrequent = frequentTopics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );
  // const filteredRecent = recentTopics.filter((t) =>
  //   t.name.toLowerCase().includes(search.toLowerCase()),
  // );

  const handleStart = async (topicId: string) => {
    try {
      startTimer(topicId);
      const formData = new FormData();
      formData.append("topicId", topicId);
      const result = await startTopicTimer(
        { message: "", success: false },
        formData,
      );
      if (!result.success) {
        toast.error(result.message || "Failed to start timer");
      }
    } catch (_error) {
      toast.error("Failed to start timer");
    }
  };

  const handleStop = async (topicId: string) => {
    try {
      const t = timers.get(topicId);
      stopTimer(topicId);
      const formData = new FormData();
      formData.append("topicId", topicId);
      if (t?.sessionId) formData.append("sessionId", t.sessionId);
      const result = await stopTopicTimer(
        { message: "", success: false },
        formData,
      );
      if (!result.success)
        toast.error(result.message || "Failed to stop timer");
    } catch (_error) {
      toast.error("Failed to stop timer");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Running Timers</CardTitle>
          </CardHeader>
          <CardContent>
            {running.length === 0 && (
              <p className="text-muted-foreground">No running timers</p>
            )}
            <div className="max-h-52 space-y-2 overflow-y-auto px-2">
              {running.map((t) => (
                <div
                  key={t.topicId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-start">
                      <TimerDisplay
                        elapsedMs={t.elapsedMs}
                        isRunning={t.isRunning}
                        color={
                          initialTopics.find((i) => i.id === t.topicId)?.color
                        }
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex size-8 items-center justify-center rounded-lg"
                        // style={{ backgroundColor: `${topic.color}20` }}
                        style={{
                          backgroundColor: `${
                            initialTopics.find((i) => i.id === t.topicId)?.color
                          }20`,
                        }}
                      >
                        {(() => {
                          const IconComp = getIconByName(
                            initialTopics.find((i) => i.id === t.topicId)
                              ?.icon || "",
                          );
                          return (
                            <IconComp
                              className="size-4 text-white"
                              style={{
                                color: initialTopics.find(
                                  (i) => i.id === t.topicId,
                                )?.color,
                              }}
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {initialTopics.find((i) => i.id === t.topicId)
                            ?.name ?? t.topicId}
                        </p>
                        <p className="text-muted-foreground text-xs">Running</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimerButton
                      isRunning={t.isRunning}
                      onStart={() => handleStart(t.topicId)}
                      onStop={() => handleStop(t.topicId)}
                      color={
                        initialTopics.find((i) => i.id === t.topicId)?.color
                      }
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>Frequent Topics</CardTitle>
            <div>
              <input
                type="text"
                placeholder="Search topics"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {frequentTopics.length === 0 && (
              <p className="text-muted-foreground">No frequent topics</p>
            )}
            <div className="max-h-56 overflow-y-auto px-6">
              <div className="flex flex-col gap-4">
                {filteredFrequent.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex size-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${topic.color}20` }}
                      >
                        {(() => {
                          const IconComp = getIconByName(
                            initialTopics.find((i) => i.id === topic.id)
                              ?.icon || "",
                          );
                          return (
                            <IconComp
                              className="size-5 text-white"
                              style={{ color: topic.color }}
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <p className="font-medium">{topic.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {topic.sessionCount} sessions
                        </p>
                      </div>
                    </div>
                    <TimerButton
                      isRunning={!!timers.get(topic.id)?.isRunning}
                      onStart={() => handleStart(topic.id)}
                      onStop={() => handleStop(topic.id)}
                      color={topic.color}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>Recently Used</CardTitle>
            <div>
              <input
                type="text"
                placeholder="Search topics"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {recentTopics.length === 0 && (
              <p className="text-muted-foreground">No recent topics</p>
            )}
            <div className="flex flex-col gap-2">
              {filteredRecent.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex size-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: topic.color }}
                    >
                      {(() => {
                        const IconComp = getIconByName(
                          initialTopics.find((i) => i.id === topic.id)?.icon ||
                            "",
                        );
                        return <IconComp className="size-4 text-white" />;
                      })()}
                    </div>
                    <div>
                      <p className="font-medium">{topic.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {topic.lastTrackedAt
                          ? new Date(topic.lastTrackedAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>
                  <TimerButton
                    isRunning={!!timers.get(topic.id)?.isRunning}
                    onStart={() => handleStart(topic.id)}
                    onStop={() => handleStop(topic.id)}
                    color={topic.color}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>

      <div>
        <TimeStatsChart
          initialTopicId={frequentTopics[0]?.id}
          className="px-0"
        />
      </div>
    </div>
  );
}
