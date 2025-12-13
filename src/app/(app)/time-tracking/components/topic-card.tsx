"use client";

import { useState } from "react";
import { Star, MoreVertical, Trash2, Edit, Archive, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimerDisplay, TimerButton } from "./timer-display";
import { formatDurationShort } from "../hooks/use-timer-sync";
import { 
  startTopicTimer, 
  stopTopicTimer, 
  updateTimeTopic, 
  deleteTimeTopic 
} from "../actions";
import type { TimeTopicWithSessions, ClientTimerState } from "@/types/time-tracking";
import { toast } from "sonner";
import { getIconByName } from "@/lib/icons";

interface TopicCardProps {
  topic: TimeTopicWithSessions;
  timerState?: ClientTimerState;
  onTimerStart: (_topicId: string) => void;
  onTimerStop: (_topicId: string) => void;
  onEdit?: (_topic: TimeTopicWithSessions) => void;
}

export function TopicCard({ 
  topic, 
  timerState, 
  onTimerStart,
  onTimerStop,
  onEdit 
}: TopicCardProps) {
  const [isPending, setIsPending] = useState(false);
  // Optimistic state for favorite
  const [optimisticFavorite, setOptimisticFavorite] = useState(topic.isFavorite);

  const isRunning = timerState?.isRunning ?? false;
  const elapsedMs = timerState?.elapsedMs ?? 0;
  const isFavorite = optimisticFavorite;

  // Get icon component
  const IconComponent = topic.icon ? getIconByName(topic.icon) : Clock;

  const handleStart = async () => {
    try {
      onTimerStart(topic.id);
      const formData = new FormData();
      formData.append("topicId", topic.id);
      const result = await startTopicTimer({ message: "", success: false }, formData);
      if (!result.success) {
        toast.error(result.message || "Failed to start timer");
      }
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const handleStop = async () => {
    try {
      setIsPending(true);
      onTimerStop(topic.id);
      const formData = new FormData();
      formData.append("topicId", topic.id);
      if (timerState?.sessionId) {
        formData.append("sessionId", timerState.sessionId);
      }
      const result = await stopTopicTimer({ message: "", success: false }, formData);
      if (!result.success) {
        toast.error(result.message || "Failed to stop timer");
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("Failed to stop timer");
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      // Optimistic update
      const newFavoriteState = !isFavorite;
      setOptimisticFavorite(newFavoriteState);

      const formData = new FormData();
      formData.append("id", topic.id);
      formData.append("isFavorite", String(newFavoriteState));
      const result = await updateTimeTopic({ message: "", success: false }, formData);
      
      if (!result.success) {
        // Revert optimistic update
        setOptimisticFavorite(isFavorite);
        toast.error(result.message || "Failed to update");
      }
    } catch (error) {
      // Revert optimistic update
      setOptimisticFavorite(isFavorite);
      toast.error("Failed to update topic");
    }
  };

  const handleArchive = async () => {
    try {
      const formData = new FormData();
      formData.append("id", topic.id);
      formData.append("isArchived", "true");
      const result = await updateTimeTopic({ message: "", success: false }, formData);
      if (!result.success) {
        toast.error(result.message || "Failed to archive");
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("Failed to archive topic");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete "${topic.name}"? This will also delete all time sessions.`,
      )
    ) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", topic.id);
      const result = await deleteTimeTopic({ message: "", success: false }, formData);
      if (!result.success) {
        toast.error(result.message || "Failed to delete");
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete topic");
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
        "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        isRunning && "ring-2 ring-offset-2 dark:ring-offset-background"
      )}
      style={{
        borderColor: isRunning ? topic.color : undefined,
        // @ts-expect-error ringColor is valid CSS custom property
        "--tw-ring-color": isRunning ? topic.color : undefined,
      }}
    >
      {/* Background gradient when running */}
      {isRunning && (
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            background: `linear-gradient(135deg, ${topic.color} 0%, transparent 60%)` 
          }}
        />
      )}

      {/* Header */}
      <div className="relative mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex size-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${topic.color}20` }}
          >
            <IconComponent 
              className="size-5" 
              style={{ color: topic.color }}
            />
          </div>
          <div>
            <h3 className="font-semibold">{topic.name}</h3>
            <p className="text-xs text-muted-foreground">
              {topic.sessionCount} sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleToggleFavorite}
          >
            <Star 
              className={cn(
                "size-4 transition-colors",
                isFavorite 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground"
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(topic)}>
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative mb-6 flex flex-col items-center py-4">
        <TimerDisplay 
          elapsedMs={elapsedMs} 
          isRunning={isRunning}
          color={topic.color}
        />
      </div>

      {/* Play/Stop Button */}
      <div className="flex justify-center">
        <TimerButton
          isRunning={isRunning}
          onStart={handleStart}
          onStop={handleStop}
          color={topic.color}
          disabled={isPending}
        />
      </div>

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-3 gap-2 border-t pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-sm font-medium">
            {formatDurationShort(Number(topic.todayDurationMs))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Week</p>
          <p className="text-sm font-medium">
            {formatDurationShort(Number(topic.weekDurationMs))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-medium">
            {formatDurationShort(Number(topic.totalDurationMs))}
          </p>
        </div>
      </div>
    </div>
  );
}
