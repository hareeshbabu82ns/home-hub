"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { getExercises } from "@/lib/actions/exercise";
import { Exercise } from "@/app/generated/prisma";
import { ExerciseFilterParams } from "@/types/exercise";
import { useDebounce } from "@/hooks/use-debounce";

interface ExercisesGridProps {
  initialExercises: Exercise[];
  initialTotal: number;
  initialHasMore: boolean;
  exerciseTypes: string[];
  exerciseTags: string[];
  exerciseEquipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export function ExercisesGrid({
  initialExercises,
  initialTotal,
  initialHasMore,
  exerciseTypes,
  exerciseTags,
  exerciseEquipment,
  primaryMuscles,
  secondaryMuscles,
}: ExercisesGridProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const exercisesRef = useRef(exercises);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<
    string[]
  >([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState<
    string[]
  >([]);
  const [showCardioOnly, setShowCardioOnly] = useState(false);
  const [showYogaOnly, setShowYogaOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [globalGender, setGlobalGender] = useState<"male" | "female">("male");

  const debouncedSearch = useDebounce(search, 300);

  // Keep ref in sync with exercises state
  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const buildFilters = useCallback((): ExerciseFilterParams => {
    return {
      search: debouncedSearch || undefined,
      type: selectedType && selectedType !== "all" ? selectedType : undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
      equipment:
        selectedEquipment.length > 0 ? selectedEquipment.join(",") : undefined,
      primaryMuscles:
        selectedPrimaryMuscles.length > 0
          ? selectedPrimaryMuscles.join(",")
          : undefined,
      secondaryMuscles:
        selectedSecondaryMuscles.length > 0
          ? selectedSecondaryMuscles.join(",")
          : undefined,
      isCardio: showCardioOnly ? true : undefined,
      isYoga: showYogaOnly ? true : undefined,
      isFav: showFavoritesOnly ? true : undefined,
    };
  }, [
    debouncedSearch,
    selectedType,
    selectedTags,
    selectedEquipment,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    showCardioOnly,
    showYogaOnly,
    showFavoritesOnly,
  ]);

  const fetchExercises = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const filters = buildFilters();
        const currentLength = reset ? 0 : exercisesRef.current.length;

        const result = await getExercises({
          ...filters,
          offset: currentLength,
          limit: 20,
        });

        if (reset) {
          setExercises(result.exercises);
          exercisesRef.current = result.exercises;
        } else {
          setExercises((prev) => {
            const newExercises = [...prev, ...result.exercises];
            exercisesRef.current = newExercises;
            return newExercises;
          });
        }

        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        setLoading(false);
      }
    },
    [buildFilters, loading],
  );

  // Load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchExercises();
    }
  }, [inView, hasMore, loading, fetchExercises]);

  // Reset and fetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExercises(true);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    debouncedSearch,
    selectedType,
    selectedTags,
    selectedEquipment,
    selectedPrimaryMuscles,
    selectedSecondaryMuscles,
    showCardioOnly,
    showYogaOnly,
    showFavoritesOnly,
  ]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleEquipmentToggle = (equipment: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment],
    );
  };

  const handlePrimaryMuscleToggle = (muscle: string) => {
    setSelectedPrimaryMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    );
  };

  const handleSecondaryMuscleToggle = (muscle: string) => {
    setSelectedSecondaryMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedTags([]);
    setSelectedEquipment([]);
    setSelectedPrimaryMuscles([]);
    setSelectedSecondaryMuscles([]);
    setShowCardioOnly(false);
    setShowYogaOnly(false);
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters =
    search ||
    (selectedType && selectedType !== "all") ||
    selectedTags.length > 0 ||
    selectedEquipment.length > 0 ||
    selectedPrimaryMuscles.length > 0 ||
    selectedSecondaryMuscles.length > 0 ||
    showCardioOnly ||
    showYogaOnly ||
    showFavoritesOnly;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Exercises</h1>
          <p className="text-muted-foreground">
            {total} exercise{total !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Gender Toggle */}
          <Button
            variant={globalGender === "male" ? "default" : "outline"}
            size="sm"
            onClick={() => setGlobalGender("male")}
            className="px-3"
          >
            ♂ Male
          </Button>
          <Button
            variant={globalGender === "female" ? "default" : "outline"}
            size="sm"
            onClick={() => setGlobalGender("female")}
            className="px-3"
          >
            ♀ Female
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="self-end sm:self-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-xs">
                {
                  [
                    search,
                    selectedType && selectedType !== "all"
                      ? selectedType
                      : null,
                    ...selectedTags,
                    showCardioOnly && "cardio",
                    showYogaOnly && "yoga",
                    showFavoritesOnly && "favorites",
                  ].filter(Boolean).length
                }
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Exercise Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {exerciseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Switches */}
            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cardio"
                    checked={showCardioOnly}
                    onCheckedChange={setShowCardioOnly}
                  />
                  <Label htmlFor="cardio" className="text-sm">
                    Cardio only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="yoga"
                    checked={showYogaOnly}
                    onCheckedChange={setShowYogaOnly}
                  />
                  <Label htmlFor="yoga" className="text-sm">
                    Yoga only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorites"
                    checked={showFavoritesOnly}
                    onCheckedChange={setShowFavoritesOnly}
                  />
                  <Label htmlFor="favorites" className="text-sm">
                    Favorites only
                  </Label>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {exerciseTags.slice(0, 20).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label>Equipment</Label>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {exerciseEquipment.slice(0, 20).map((equipment) => (
                  <Badge
                    key={equipment}
                    variant={
                      selectedEquipment.includes(equipment)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer text-xs"
                    onClick={() => handleEquipmentToggle(equipment)}
                  >
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Primary Muscles */}
            <div className="space-y-2">
              <Label>Primary Muscles</Label>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {primaryMuscles.slice(0, 20).map((muscle) => (
                  <Badge
                    key={muscle}
                    variant={
                      selectedPrimaryMuscles.includes(muscle)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer text-xs"
                    onClick={() => handlePrimaryMuscleToggle(muscle)}
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Secondary Muscles */}
            <div className="space-y-2">
              <Label>Secondary Muscles</Label>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {secondaryMuscles.slice(0, 15).map((muscle) => (
                  <Badge
                    key={muscle}
                    variant={
                      selectedSecondaryMuscles.includes(muscle)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer text-xs"
                    onClick={() => handleSecondaryMuscleToggle(muscle)}
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            globalGender={globalGender}
          />
        ))}

        {/* Loading skeletons */}
        {loading && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {/* No results */}
      {!loading && exercises.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No exercises found matching your criteria.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
