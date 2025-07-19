"use server";

import { db } from "@/lib/db";
import { ExerciseFilterParams } from "@/types/exercise";

export async function getExercises(params?: ExerciseFilterParams) {
  const {
    search,
    type,
    tags,
    isCardio,
    isYoga,
    isFav,
    limit = 20,
    offset = 0,
  } = params || {};

  try {
    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { commonName: { contains: search, mode: "insensitive" as const } },
          { tags: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(type && { type: { contains: type, mode: "insensitive" as const } }),
      ...(tags && { tags: { contains: tags, mode: "insensitive" as const } }),
      ...(isCardio === true && { isCardio: true }),
      ...(isYoga === true && { isYoga: true }),
      ...(isFav === true && { isFav: true }),
    };

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
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw new Error("Failed to fetch exercises");
  }
}

export async function getExerciseById(id: string) {
  try {
    const exercise = await db.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new Error("Exercise not found");
    }

    return exercise;
  } catch (error) {
    console.error("Error fetching exercise:", error);
    throw new Error("Failed to fetch exercise");
  }
}

export async function getExerciseTypes() {
  try {
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
  } catch (error) {
    console.error("Error fetching exercise types:", error);
    return [];
  }
}

export async function getExerciseTags() {
  try {
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
  } catch (error) {
    console.error("Error fetching exercise tags:", error);
    return [];
  }
}
