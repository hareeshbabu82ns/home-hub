/**
 * Exercise Service
 * Contains business logic for exercise management
 * Uses repositories for data access
 */

import { exerciseRepository } from "@/lib/db/repositories";
import type { ExerciseFilterParams } from "@/types/exercise";

class ExerciseService {
  /**
   * Get exercise by ID
   */
  async getById(id: string) {
    return exerciseRepository.findById(id);
  }

  /**
   * Get exercises with filters
   */
  async getWithFilters(params?: ExerciseFilterParams) {
    return exerciseRepository.findWithFilters(params);
  }

  /**
   * Get all available exercise types
   */
  async getAvailableTypes() {
    return exerciseRepository.getDistinctTypes();
  }

  /**
   * Get all available exercise tags
   */
  async getAvailableTags() {
    return exerciseRepository.getDistinctTags();
  }

  /**
   * Get all available equipment
   */
  async getAvailableEquipment() {
    return exerciseRepository.getDistinctEquipment();
  }

  /**
   * Get all available primary muscles
   */
  async getAvailablePrimaryMuscles() {
    return exerciseRepository.getDistinctPrimaryMuscles();
  }

  /**
   * Get all available secondary muscles
   */
  async getAvailableSecondaryMuscles() {
    return exerciseRepository.getDistinctSecondaryMuscles();
  }
}

export const exerciseService = new ExerciseService();
