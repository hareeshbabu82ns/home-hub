"use client";

import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "../hooks/use-timer-sync";

interface TimerDisplayProps {
  elapsedMs: number;
  isRunning: boolean;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function TimerDisplay({
  elapsedMs,
  isRunning,
  color = "#6366f1",
  size = "md",
}: TimerDisplayProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect when running */}
      {isRunning && (
        <div
          className="absolute inset-0 animate-pulse rounded-full opacity-20 blur-xl"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className={cn(
          "font-mono font-bold tracking-wider tabular-nums transition-all duration-300",
          sizeClasses[size],
          isRunning ? "text-foreground" : "text-muted-foreground",
        )}
        style={{
          textShadow: isRunning ? `0 0 20px ${color}40` : "none",
        }}
      >
        {formatTime(elapsedMs)}
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div
          className="ml-2 size-2 animate-pulse rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

interface TimerButtonProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  color?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TimerButton({
  isRunning,
  onStart,
  onStop,
  color = "#6366f1",
  disabled = false,
  size = "md",
}: TimerButtonProps) {
  const sizeClasses = {
    sm: "size-10",
    md: "size-14",
    lg: "size-20",
  };

  const iconSizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  return (
    <button
      onClick={isRunning ? onStop : onStart}
      disabled={disabled}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300",
        "hover:scale-105 active:scale-95",
        "focus:ring-2 focus:ring-offset-2 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
        sizeClasses[size],
      )}
      style={{
        backgroundColor: isRunning ? "#ef4444" : color,
        boxShadow: `0 4px 20px ${isRunning ? "#ef444440" : `${color}40`}`,
      }}
    >
      {/* Pulse ring when running */}
      {isRunning && (
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-40"
          style={{ backgroundColor: "#ef4444" }}
        />
      )}

      {isRunning ? (
        <Square className={cn("fill-white text-white", iconSizes[size])} />
      ) : (
        <Play className={cn("ml-1 fill-white text-white", iconSizes[size])} />
      )}
    </button>
  );
}
