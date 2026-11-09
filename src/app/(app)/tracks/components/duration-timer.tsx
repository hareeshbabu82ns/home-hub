"use client";

import { useState, useEffect, useActionState } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startTimer, stopTimer, pauseTimer, resumeTimer } from "../actions";
import type { TrackAttributes } from "@/app/generated/prisma";
import type { TimerState } from "@/types/track";
import { toast } from "sonner";

interface DurationTimerProps {
  attribute: TrackAttributes;
  className?: string;
  onTimerUpdate?: () => void;
}

export function DurationTimer({
  attribute,
  className,
  onTimerUpdate,
}: DurationTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>(() => ({
    id: attribute.id,
    isRunning: attribute.isTimerRunning || false,
    startTime: attribute.timerStartTime || undefined,
    endTime: attribute.timerEndTime || undefined,
    elapsedMs: 0,
  }));

  // Action states for timer operations
  const [startState, startAction] = useActionState(startTimer, {
    message: "",
    success: false,
  });
  const [stopState, stopAction] = useActionState(stopTimer, {
    message: "",
    success: false,
  });
  const [pauseState, pauseAction] = useActionState(pauseTimer, {
    message: "",
    success: false,
  });
  const [resumeState, resumeAction] = useActionState(resumeTimer, {
    message: "",
    success: false,
  });

  // Update timer display every second when running
  useEffect(() => {
    if (!timerState.isRunning || !timerState.startTime) return;

    const startTime = new Date(
      timerState.startTime as unknown as string | number | Date,
    );
    const updateTimer = () => {
      const now = new Date();
      const existingMinutes = attribute.valueDuration || 0;
      const elapsedMs =
        now.getTime() - startTime.getTime() + existingMinutes * 60 * 1000;

      setTimerState((prev) => ({ ...prev, elapsedMs }));
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    timerState.isRunning,
    timerState.startTime,
    attribute.id,
    attribute.valueDuration,
  ]);

  // Update timer state when attribute changes
  useEffect(() => {
    setTimerState({
      id: attribute.id,
      isRunning: attribute.isTimerRunning || false,
      startTime: attribute.timerStartTime || undefined,
      endTime: attribute.timerEndTime || undefined,
      elapsedMs: timerState.elapsedMs,
    });
  }, [
    attribute.id,
    attribute.isTimerRunning,
    attribute.timerStartTime,
    attribute.timerEndTime,
    timerState.elapsedMs,
  ]);

  // Handle action results
  useEffect(() => {
    if (startState.success) {
      toast.success(startState.message);
      onTimerUpdate?.();
    } else if (startState.message && !startState.success) {
      toast.error(startState.message);
    }
  }, [startState, onTimerUpdate]);

  useEffect(() => {
    if (stopState.success) {
      toast.success(stopState.message);
      onTimerUpdate?.();
    } else if (stopState.message && !stopState.success) {
      toast.error(stopState.message);
    }
  }, [stopState, onTimerUpdate]);

  useEffect(() => {
    if (pauseState.success) {
      toast.success(pauseState.message);
      onTimerUpdate?.();
    } else if (pauseState.message && !pauseState.success) {
      toast.error(pauseState.message);
    }
  }, [pauseState, onTimerUpdate]);

  useEffect(() => {
    if (resumeState.success) {
      toast.success(resumeState.message);
      onTimerUpdate?.();
    } else if (resumeState.message && !resumeState.success) {
      toast.error(resumeState.message);
    }
  }, [resumeState, onTimerUpdate]);

  const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getDisplayDuration = (): string => {
    if (
      timerState.isRunning &&
      timerState.elapsedMs &&
      timerState.elapsedMs > 0
    ) {
      return formatDuration(timerState.elapsedMs);
    }

    if (attribute.valueDuration) {
      const ms = attribute.valueDuration * 60 * 1000;
      return formatDuration(ms);
    }

    return "0:00";
  };

  const handleStart = () => {
    const formData = new FormData();
    formData.append("trackId", attribute.trackId);
    formData.append("title", attribute.title);
    formData.append("valueType", "DURATION");
    startAction(formData);
  };

  const handleStop = () => {
    const formData = new FormData();
    formData.append("id", attribute.id);
    stopAction(formData);
  };

  const handlePause = () => {
    const formData = new FormData();
    formData.append("id", attribute.id);
    pauseAction(formData);
  };

  const handleResume = () => {
    const formData = new FormData();
    formData.append("id", attribute.id);
    resumeAction(formData);
  };

  const isPaused =
    !timerState.isRunning &&
    attribute.valueDuration &&
    attribute.valueDuration > 0 &&
    !attribute.timerEndTime;
  const isStopped =
    !timerState.isRunning &&
    (!attribute.valueDuration || attribute.timerEndTime);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Timer Display */}
      <div
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 font-mono text-sm",
          timerState.isRunning
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
            : isPaused
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
              : "bg-muted text-muted-foreground",
        )}
      >
        <Clock className="size-3" />
        <span>{getDisplayDuration()}</span>
        {timerState.isRunning && (
          <div className="ml-1 size-2 animate-pulse rounded-full bg-current" />
        )}
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-1">
        {isStopped && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            className="h-8 w-8 p-0"
            title="Start timer"
          >
            <Play className="size-3" />
          </Button>
        )}

        {isPaused && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResume}
            className="h-8 w-8 p-0"
            title="Resume timer"
          >
            <Play className="size-3" />
          </Button>
        )}

        {timerState.isRunning && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              className="h-8 w-8 p-0"
              title="Pause timer"
            >
              <Pause className="size-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="h-8 w-8 p-0"
              title="Stop and save"
            >
              <Square className="size-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
