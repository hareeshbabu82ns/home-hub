import { Suspense } from "react";
import { Metadata } from "next";
import {
  getExercises,
  getExerciseTypes,
  getExerciseTags,
} from "@/lib/actions/exercise";
import { ExercisesGrid } from "@/components/exercise/ExercisesGrid";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Exercises | Home Hub",
  description:
    "Browse and discover exercises with detailed instructions and animations.",
};

async function ExercisesContent() {
  const [exercisesResult, exerciseTypes, exerciseTags] = await Promise.all([
    getExercises({ limit: 20, offset: 0 }),
    getExerciseTypes(),
    getExerciseTags(),
  ]);

  return (
    <ExercisesGrid
      initialExercises={exercisesResult.exercises}
      initialTotal={exercisesResult.total}
      initialHasMore={exercisesResult.hasMore}
      exerciseTypes={exerciseTypes}
      exerciseTags={exerciseTags}
    />
  );
}

function ExercisesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ExercisesLoading />}>
        <ExercisesContent />
      </Suspense>
    </div>
  );
}
