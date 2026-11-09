"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ClientTimerState,
  TimeTopicWithSessions,
} from "@/types/time-tracking";

interface UseTimerSyncOptions {
  topics: TimeTopicWithSessions[];
  onTimerUpdate?: () => void;
}

export function useTimerSync({ topics, onTimerUpdate }: UseTimerSyncOptions) {
  const [timers, setTimers] = useState<Map<string, ClientTimerState>>(
    new Map(),
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timers from server state
  useEffect(() => {
    const newTimers = new Map<string, ClientTimerState>();

    topics.forEach((topic) => {
      if (topic.activeSession) {
        const startTime = new Date(topic.activeSession.startTime).getTime();
        const elapsedMs = Date.now() - startTime;

        newTimers.set(topic.id, {
          topicId: topic.id,
          isRunning: true,
          startTime,
          elapsedMs,
          sessionId: topic.activeSession.id,
        });
      }
    });

    setTimers(newTimers);
  }, [topics]);

  // Update elapsed time every second for running timers
  useEffect(() => {
    const updateElapsed = () => {
      setTimers((prev) => {
        const updated = new Map(prev);
        let hasChanges = false;

        updated.forEach((timer, topicId) => {
          if (timer.isRunning) {
            const elapsedMs = Date.now() - timer.startTime;
            if (
              Math.floor(elapsedMs / 1000) !==
              Math.floor(timer.elapsedMs / 1000)
            ) {
              updated.set(topicId, { ...timer, elapsedMs });
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    };

    intervalRef.current = setInterval(updateElapsed, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start timer (optimistic update)
  const startTimer = useCallback((topicId: string) => {
    const startTime = Date.now();

    setTimers((prev) => {
      const updated = new Map(prev);
      updated.set(topicId, {
        topicId,
        isRunning: true,
        startTime,
        elapsedMs: 0,
      });
      return updated;
    });

    return startTime;
  }, []);

  // Stop timer (optimistic update)
  const stopTimer = useCallback(
    (_topicId: string) => {
      const timer = timers.get(_topicId);
      if (!timer) return null;

      const finalElapsed = Date.now() - timer.startTime;

      setTimers((prev) => {
        const updated = new Map(prev);
        updated.delete(_topicId);
        return updated;
      });

      onTimerUpdate?.();
      return finalElapsed;
    },
    [timers, onTimerUpdate],
  );

  // Get timer state for a topic
  const getTimer = useCallback(
    (_topicId: string): ClientTimerState | undefined => {
      return timers.get(_topicId);
    },
    [timers],
  );

  // Check if any timer is running
  const hasRunningTimer = useCallback((): boolean => {
    return Array.from(timers.values()).some((t) => t.isRunning);
  }, [timers]);

  // Get all running timers
  const getRunningTimers = useCallback((): ClientTimerState[] => {
    return Array.from(timers.values()).filter((t) => t.isRunning);
  }, [timers]);

  return {
    timers,
    startTimer,
    stopTimer,
    getTimer,
    hasRunningTimer,
    getRunningTimers,
  };
}

// Format milliseconds to display string
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Format duration for display (e.g., "2h 30m")
export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }

  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}
