"use server";

import { exerciseService } from "@/lib/services";
import type { ExerciseFilterParams } from "@/types/exercise";

/**
 * Controller: Get exercises with filters
 */
export async function getExercises(params?: ExerciseFilterParams) {
  try {
    const result = await exerciseService.getWithFilters(params);
    return result;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw new Error("Failed to fetch exercises");
  }
}

/**
 * Controller: Get exercise by ID
 */
export async function getExerciseById(id: string) {
  try {
    const exercise = await exerciseService.getById(id);

    if (!exercise) {
      throw new Error("Exercise not found");
    }

    return exercise;
  } catch (error) {
    console.error("Error fetching exercise:", error);
    throw new Error("Failed to fetch exercise");
  }
}

/**
 * Controller: Get all exercise types
 */
export async function getExerciseTypes() {
  try {
    return await exerciseService.getAvailableTypes();
  } catch (error) {
    console.error("Error fetching exercise types:", error);
    return [];
  }
}

/**
 * Controller: Get all exercise tags
 */
export async function getExerciseTags() {
  try {
    return await exerciseService.getAvailableTags();
  } catch (error) {
    console.error("Error fetching exercise tags:", error);
    return [];
  }
}

/**
 * Controller: Get all exercise equipment
 */
export async function getExerciseEquipment() {
  try {
    return await exerciseService.getAvailableEquipment();
  } catch (error) {
    console.error("Error fetching exercise equipment:", error);
    return [];
  }
}

/**
 * Controller: Get all primary muscles
 */
export async function getExercisePrimaryMuscles() {
  try {
    return await exerciseService.getAvailablePrimaryMuscles();
  } catch (error) {
    console.error("Error fetching exercise primary muscles:", error);
    return [];
  }
}

/**
 * Controller: Get all secondary muscles
 */
export async function getExerciseSecondaryMuscles() {
  try {
    return await exerciseService.getAvailableSecondaryMuscles();
  } catch (error) {
    console.error("Error fetching exercise secondary muscles:", error);
    return [];
  }
}
