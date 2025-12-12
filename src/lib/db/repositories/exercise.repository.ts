/**
 * Exercise Repository
 * Handles all database operations related to exercises
 * This layer should only contain database queries and mutations
 */

import { db } from "@/lib/db";
import type { ExerciseFilterParams } from "@/types/exercise";

export const exerciseRepository = {
  // Find operations
  findById: async (id: string) => {
    return db.exercise.findUnique({
      where: { id },
    });
  },

  findByTitle: async (title: string) => {
    return db.exercise.findFirst({
      where: { title },
    });
  },

  // Query operations with filtering
  findWithFilters: async (params?: ExerciseFilterParams) => {
    const {
      search,
      type,
      tags,
      equipment,
      primaryMuscles,
      secondaryMuscles,
      isCardio,
      isYoga,
      isFav,
      limit = 20,
      offset = 0,
    } = params || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: Array<Record<string, any>> = [];

    // Search condition
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { commonName: { contains: search, mode: "insensitive" as const } },
          { tags: { contains: search, mode: "insensitive" as const } },
          { equipment: { contains: search, mode: "insensitive" as const } },
          {
            primaryMuscles: { contains: search, mode: "insensitive" as const },
          },
          {
            secondaryMuscles: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          { instructions: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    // Type filter
    if (type) {
      whereConditions.push({
        type: { contains: type, mode: "insensitive" as const },
      });
    }

    // Tags filter
    if (tags) {
      whereConditions.push({
        tags: { contains: tags, mode: "insensitive" as const },
      });
    }

    // Equipment filter - any of the selected equipment
    if (equipment) {
      whereConditions.push({
        OR: equipment.split(",").map((eq) => ({
          equipment: { contains: eq.trim(), mode: "insensitive" as const },
        })),
      });
    }

    // Primary muscles filter - any of the selected muscles
    if (primaryMuscles) {
      whereConditions.push({
        OR: primaryMuscles.split(",").map((muscle) => ({
          primaryMuscles: {
            contains: muscle.trim(),
            mode: "insensitive" as const,
          },
        })),
      });
    }

    // Secondary muscles filter - any of the selected muscles
    if (secondaryMuscles) {
      whereConditions.push({
        OR: secondaryMuscles.split(",").map((muscle) => ({
          secondaryMuscles: {
            contains: muscle.trim(),
            mode: "insensitive" as const,
          },
        })),
      });
    }

    // Boolean filters
    if (isCardio === true) {
      whereConditions.push({ isCardio: true });
    }

    if (isYoga === true) {
      whereConditions.push({ isYoga: true });
    }

    if (isFav === true) {
      whereConditions.push({ isFav: true });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [exercises, total] = await Promise.all([
      db.exercise.findMany({
        where,
        orderBy: { title: "asc" },
        skip: offset,
        take: limit,
      }),
      db.exercise.count({ where }),
    ]);

    return {
      exercises,
      total,
      hasMore: offset + exercises.length < total,
    };
  },

  // Aggregation operations
  getDistinctTypes: async () => {
    const exercises = await db.exercise.findMany({
      select: { type: true },
      where: { type: { not: "" } },
    });

    const allTypes = exercises
      .map((e: { type: string | null }) => e.type)
      .filter((type): type is string => type !== null && type !== "")
      .flatMap((type: string) => type.split(",").map((t: string) => t.trim()))
      .filter(Boolean);

    return Array.from(new Set(allTypes));
  },

  getDistinctTags: async () => {
    const exercises = await db.exercise.findMany({
      select: { tags: true },
      where: { tags: { not: null } },
    });

    const allTags = exercises
      .map((e: { tags: string | null }) => e.tags)
      .filter((tags): tags is string => tags !== null)
      .flatMap((tags: string) =>
        tags.split(",").map((tag: string) => tag.trim()),
      )
      .filter(Boolean);

    return Array.from(new Set(allTags));
  },

  getDistinctEquipment: async () => {
    const exercises = await db.exercise.findMany({
      select: { equipment: true },
      where: { equipment: { not: null } },
    });

    const allEquipment = exercises
      .map((e: { equipment: string | null }) => e.equipment)
      .filter((equipment): equipment is string => equipment !== null)
      .flatMap((equipment: string) =>
        equipment.split(",").map((eq: string) => eq.trim()),
      )
      .filter(Boolean);

    return Array.from(new Set(allEquipment));
  },

  getDistinctPrimaryMuscles: async () => {
    const exercises = await db.exercise.findMany({
      select: { primaryMuscles: true },
      where: { primaryMuscles: { not: null } },
    });

    const allMuscles = exercises
      .map((e: { primaryMuscles: string | null }) => e.primaryMuscles)
      .filter((muscles): muscles is string => muscles !== null)
      .flatMap((muscles: string) =>
        muscles.split(",").map((muscle: string) => muscle.trim()),
      )
      .filter(Boolean);

    return Array.from(new Set(allMuscles));
  },

  getDistinctSecondaryMuscles: async () => {
    const exercises = await db.exercise.findMany({
      select: { secondaryMuscles: true },
      where: { secondaryMuscles: { not: null } },
    });

    const allMuscles = exercises
      .map((e: { secondaryMuscles: string | null }) => e.secondaryMuscles)
      .filter((muscles): muscles is string => muscles !== null)
      .flatMap((muscles: string) =>
        muscles.split(",").map((muscle: string) => muscle.trim()),
      )
      .filter(Boolean);

    return Array.from(new Set(allMuscles));
  },
};
