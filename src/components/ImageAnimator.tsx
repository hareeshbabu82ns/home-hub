"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageAnimatorProps {
  images: string[]; // Array of image URLs
  className?: string;
  animationDuration?: number; // Duration in milliseconds for full cycle
  autoPlay?: boolean;
  loop?: boolean;
  playOnHover?: boolean; // Play animation on hover
  // eslint-disable-next-line no-unused-vars
  onImageChange?: (imageIndex: number, imageUrl: string) => void;
}

export default function ImageAnimator({
  images,
  className,
  animationDuration = 2000,
  autoPlay = false,
  loop = true,
  playOnHover = false,
  onImageChange,
}: ImageAnimatorProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out images that failed to load
  const validImages = images.filter((_, index) => !imageErrors.has(index));

  // Handle image load error
  const handleImageError = (index: number) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };

  // Animation logic
  useEffect(() => {
    if (isPlaying && validImages.length > 1) {
      const frameDuration = animationDuration / validImages.length;

      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % validImages.length;

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
  }, [isPlaying, validImages.length, animationDuration, loop]);

  // Notify parent component when image changes
  useEffect(() => {
    if (validImages.length > 0 && onImageChange) {
      const currentImage = validImages[currentImageIndex];
      onImageChange(currentImageIndex, currentImage);
    }
  }, [currentImageIndex, validImages, onImageChange]);

  // Handle hover events
  const handleMouseEnter = () => {
    if (playOnHover && validImages.length > 1) {
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (playOnHover) {
      setIsPlaying(false);
      // Reset to first image when stopping
      setCurrentImageIndex(0);
    }
  };

  // Handle click to toggle play/pause
  const handleClick = () => {
    if (validImages.length > 1) {
      setIsPlaying(!isPlaying);
    }
  };

  // If no valid images, show placeholder
  if (validImages.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex h-full w-full items-center justify-center",
          className,
        )}
      >
        <span className="text-sm">No images available</span>
      </div>
    );
  }

  // If only one image, show static image
  if (validImages.length === 1) {
    return (
      <div
        className={cn("relative h-full w-full", className)}
        ref={containerRef}
      >
        <Image
          src={`/api${validImages[0]}`}
          alt="Exercise demonstration"
          fill
          className="object-contain"
          onError={() => handleImageError(0)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full cursor-pointer", className)}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={
        playOnHover
          ? "Hover to animate"
          : isPlaying
            ? "Click to pause"
            : "Click to play"
      }
    >
      {/* Current Image */}
      <Image
        src={`/api${validImages[currentImageIndex]}`}
        alt={`Exercise demonstration frame ${currentImageIndex + 1}`}
        fill
        className="object-contain"
        onError={() =>
          handleImageError(images.indexOf(validImages[currentImageIndex]))
        }
        priority={currentImageIndex === 0}
      />

      {/* Animation indicator */}
      {validImages.length > 1 && (
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* Play/Pause indicator */}
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isPlaying ? "bg-green-500" : "bg-yellow-500",
            )}
          />
          {/* Frame indicator */}
          <span className="rounded bg-black/50 px-1 text-xs text-white">
            {currentImageIndex + 1}/{validImages.length}
          </span>
        </div>
      )}

      {/* Preload next few images for smooth animation */}
      {validImages
        .slice(1, Math.min(4, validImages.length))
        .map((imageUrl, index) => (
          <Image
            key={`preload-${index}`}
            src={`/api${imageUrl}`}
            alt=""
            width={1}
            height={1}
            className="invisible absolute"
            onError={() => handleImageError(images.indexOf(imageUrl))}
          />
        ))}
    </div>
  );
}
