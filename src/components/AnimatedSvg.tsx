"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSvgProps {
  src: string; // Path to the SVG file
  className?: string;
  animationDuration?: number; // Duration in milliseconds
  autoPlay?: boolean;
  loop?: boolean;
  playOnHover?: boolean; // New prop for hover-based animation
  onFrameChange?: (frameIndex: number, frameId: string) => void;
}

interface SvgFrame {
  id: string;
  element: SVGGElement;
}

export default function AnimatedSvg({
  src,
  className,
  animationDuration = 1000,
  autoPlay = true,
  loop = true,
  playOnHover = false,
  onFrameChange,
}: AnimatedSvgProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [frames, setFrames] = useState<SvgFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load and parse SVG
  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(src);
        const svgText = await response.text();

        if (svgRef.current) {
          svgRef.current.innerHTML = svgText;
          const svgElement = svgRef.current.querySelector("svg");

          if (svgElement) {
            // Find all groups with alphabetical IDs (a, b, c, etc.)
            const groups = Array.from(
              svgElement.querySelectorAll("g[id]"),
            ).filter((g) => {
              const id = g.getAttribute("id");
              return id && /^[a-z]_.*$/.test(id);
            }) as SVGGElement[];

            // Sort groups by ID alphabetically
            const sortedGroups = groups.sort((a, b) => {
              const idA = a.getAttribute("id") || "";
              const idB = b.getAttribute("id") || "";
              return idA.localeCompare(idB);
            });

            const frameData: SvgFrame[] = sortedGroups.map((group) => ({
              id: group.getAttribute("id") || "",
              element: group,
            }));

            setFrames(frameData);

            // Initially hide all frames except the first one
            frameData.forEach((frame, index) => {
              frame.element.style.display = index === 0 ? "block" : "none";
            });
          }
        }
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    };

    loadSvg();
  }, [src]);

  // Animation logic
  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      const frameDuration = animationDuration / frames.length;

      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % frames.length;

          // If not looping and we've reached the end, stop playing
          if (!loop && nextIndex === 0) {
            setIsPlaying(false);
            return prevIndex;
          }

          return nextIndex;
        });
      }, frameDuration);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isPlaying, frames.length, animationDuration, loop]);

  // Update visibility when frame changes
  useEffect(() => {
    if (frames.length > 0) {
      frames.forEach((frame, index) => {
        frame.element.style.display =
          index === currentFrameIndex ? "block" : "none";
      });

      // Call callback if provided
      if (onFrameChange && frames[currentFrameIndex]) {
        onFrameChange(currentFrameIndex, frames[currentFrameIndex].id);
      }
    }
  }, [currentFrameIndex, frames, onFrameChange]);

  const handleMouseEnter = () => {
    if (playOnHover && !isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (playOnHover && isPlaying) {
      setIsPlaying(false);
      setCurrentFrameIndex(0); // Reset to first frame
    }
  };

  return (
    <div
      className={cn("inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={svgRef} className="h-full w-full" />
    </div>
  );
}

// Hook to use AnimatedSvg with external controls
export function useAnimatedSvg() {
  const ref = useRef<{
    play: () => void;
    pause: () => void;
    stop: () => void;
    goToFrame: (frameIndex: number) => void;
    isPlaying: boolean;
    currentFrame: number;
    totalFrames: number;
  } | null>(null);

  return {
    ref,
    play: () => ref.current?.play(),
    pause: () => ref.current?.pause(),
    stop: () => ref.current?.stop(),
    goToFrame: (frameIndex: number) => ref.current?.goToFrame(frameIndex),
    get isPlaying() {
      return ref.current?.isPlaying || false;
    },
    get currentFrame() {
      return ref.current?.currentFrame || 0;
    },
    get totalFrames() {
      return ref.current?.totalFrames || 0;
    },
  };
}
