"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/app/generated/prisma";
import type {
  ExerciseImage,
  ExerciseAnimation,
  ExerciseLocalImages,
} from "@/types/exercise";
import AnimatedSvg from "@/components/AnimatedSvg";
import ImageAnimator from "@/components/ImageAnimator";

interface ExerciseCardProps {
  exercise: Exercise;
  globalGender?: "male" | "female";
  // eslint-disable-next-line no-unused-vars
  onFavoriteToggle?: (exerciseId: string, isFav: boolean) => void;
}

export function ExerciseCard({
  exercise,
  globalGender = "male",
  onFavoriteToggle,
}: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);

  const img = exercise.img as ExerciseImage | null;
  const anim = exercise.anim as ExerciseAnimation | null;
  const localImages = exercise.localImages as ExerciseLocalImages | null;

  const getImageUrl = () => {
    if (!img) return null;
    // Try preferred gender first, then fallback to other gender
    const preferred = globalGender === "male" ? img.male : img.female;
    const fallback = globalGender === "male" ? img.female : img.male;
    return preferred || fallback;
  };

  const getAnimationUrl = () => {
    if (!anim) return null;
    // Try preferred gender first, then fallback to other gender
    const preferred = globalGender === "male" ? anim.male : anim.female;
    const fallback = globalGender === "male" ? anim.female : anim.male;
    return preferred || fallback;
  };

  const getLocalImages = (): string[] => {
    if (!localImages) return [];
    // Sort by image number (image_1, image_2, etc.)
    const sortedKeys = Object.keys(localImages).sort((a, b) => {
      const numA = parseInt(a.split("_")[1] || "0");
      const numB = parseInt(b.split("_")[1] || "0");
      return numA - numB;
    });
    return sortedKeys.map((key) => localImages[key]);
  };

  // Always prefer animation if available, fallback to static image
  const currentImageUrl = getAnimationUrl() || getImageUrl();
  const localImageUrls = getLocalImages();

  // Check if the current URL is an SVG file
  const isSvgAnimation = currentImageUrl?.endsWith(".svg");

  const handleFavoriteClick = () => {
    onFavoriteToggle?.(exercise.id, !exercise.isFav);
  };

  const tags = exercise.tags
    ? exercise.tags.split(",").map((tag) => tag.trim())
    : [];

  // const equipment = exercise.equipment
  //   ? exercise.equipment.split(",").map((eq) => eq.trim())
  //   : [];

  // const primaryMuscles = exercise.primaryMuscles
  //   ? exercise.primaryMuscles.split(",").map((muscle) => muscle.trim())
  //   : [];

  // const secondaryMuscles = exercise.secondaryMuscles
  //   ? exercise.secondaryMuscles.split(",").map((muscle) => muscle.trim())
  //   : [];

  return (
    <Card className="group flex h-full flex-col transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 flex-1 text-sm font-semibold">
            {exercise.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 shrink-0 p-0",
              exercise.isFav && "text-red-500",
            )}
            onClick={handleFavoriteClick}
          >
            <Heart
              className={cn("h-4 w-4", exercise.isFav && "fill-current")}
            />
          </Button>
        </div>

        <div className="text-muted-foreground no-scrollbar flex items-center gap-2 overflow-x-auto text-xs">
          {exercise.type.split(",").map((etype) => (
            <Badge
              key={etype.trim()}
              variant="secondary"
              className="shrink-0 text-xs"
            >
              {etype.trim()}
            </Badge>
          ))}
          {exercise.isCardio && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Cardio
            </Badge>
          )}
          {exercise.isYoga && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Yoga
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 dark:border-slate-700">
          {currentImageUrl && !imageError ? (
            isSvgAnimation ? (
              <div className="flex h-full w-full items-center justify-center p-4">
                <AnimatedSvg
                  src={`/api${currentImageUrl}`}
                  className="h-full max-h-full w-full max-w-full"
                  animationDuration={2000}
                  autoPlay={false}
                  playOnHover={true}
                  loop={true}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-2">
                <Image
                  src={`/api${currentImageUrl}`}
                  alt={exercise.title}
                  fill
                  className="object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
            )
          ) : localImageUrls.length > 0 ? (
            <div className="flex h-full w-full items-center justify-center p-2">
              <ImageAnimator
                images={localImageUrls}
                className="h-full w-full"
                animationDuration={2000}
                autoPlay={false}
                playOnHover={true}
                loop={true}
              />
            </div>
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <span className="text-sm">No image</span>
            </div>
          )}
        </div>

        {exercise.commonName && exercise.commonName !== exercise.title && (
          <p className="text-muted-foreground mb-2 line-clamp-1 text-xs">
            Also known as: {exercise.commonName}
          </p>
        )}

        {exercise.presetNotes && (
          <p className="text-muted-foreground mb-2 line-clamp-3 text-xs">
            {exercise.presetNotes}
          </p>
        )}

        {/* {exercise.instructions && (
          <div className="mb-2">
            <h4 className="mb-1 text-xs font-medium">Instructions:</h4>
            <p className="text-muted-foreground line-clamp-3 text-xs">
              {exercise.instructions}
            </p>
          </div>
        )} */}

        {/* {equipment.length > 0 && (
          <div className="mb-2">
            <h4 className="mb-1 text-xs font-medium">Equipment:</h4>
            <div className="flex flex-wrap gap-1">
              {equipment.slice(0, 3).map((eq) => (
                <Badge key={eq} variant="secondary" className="text-xs">
                  {eq}
                </Badge>
              ))}
              {equipment.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{equipment.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )} */}

        {/* {primaryMuscles.length > 0 && (
          <div className="mb-2">
            <h4 className="mb-1 text-xs font-medium">Primary Muscles:</h4>
            <div className="flex flex-wrap gap-1">
              {primaryMuscles.slice(0, 3).map((muscle) => (
                <Badge key={muscle} variant="default" className="text-xs">
                  {muscle}
                </Badge>
              ))}
              {primaryMuscles.length > 3 && (
                <Badge variant="default" className="text-xs">
                  +{primaryMuscles.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )} */}

        {/* {secondaryMuscles.length > 0 && (
          <div className="mb-2">
            <h4 className="mb-1 text-xs font-medium">Secondary Muscles:</h4>
            <div className="flex flex-wrap gap-1">
              {secondaryMuscles.slice(0, 2).map((muscle) => (
                <Badge key={muscle} variant="outline" className="text-xs">
                  {muscle}
                </Badge>
              ))}
              {secondaryMuscles.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{secondaryMuscles.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )} */}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* <CardFooter className="pt-0">
        {exercise.permalink && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            asChild
          >
            <a
              href={exercise.permalink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View Details
            </a>
          </Button>
        )}
      </CardFooter> */}
    </Card>
  );
}
