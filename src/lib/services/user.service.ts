/**
 * User Service
 * Contains business logic for user management
 * Uses repositories for data access
 */

import { userRepository } from "@/lib/db/repositories";
import { hash, compare } from "bcryptjs";
import type { $Enums } from "@/app/generated/prisma";

type UserRole = $Enums.UserRole;

class UserService {
  /**
   * Get user by ID
   */
  async getById(id: string) {
    return userRepository.findById(id);
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  /**
   * Get all users
   */
  async getAll() {
    return userRepository.findAll();
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string) {
    const user = await this.getByEmail(email);
    return !!user;
  }

  /**
   * Create new user
   */
  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
  }) {
    // Hash password
    const hashedPassword = await hash(data.password, 10);

    return userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string) {
    return compare(plainPassword, hashedPassword);
  }

  /**
   * Update user
   */
  async update(
    id: string,
    data: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
      image?: string;
    },
  ) {
    return userRepository.update(id, data);
  }

  /**
   * Change user password
   */
  async changePassword(id: string, newPassword: string) {
    const hashedPassword = await hash(newPassword, 10);
    return userRepository.updatePassword(id, hashedPassword);
  }

  /**
   * Update user role
   */
  async updateRole(id: string, role: UserRole) {
    return userRepository.updateRole(id, role);
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleStatus(id: string, isActive: boolean) {
    return userRepository.toggleStatus(id, isActive);
  }

  /**
   * Delete user
   */
  async delete(id: string) {
    return userRepository.delete(id);
  }

  /**
   * Count users by role
   */
  async countByRole(role: UserRole) {
    return userRepository.countByRole(role);
  }

  /**
   * Make user admin
   */
  async makeAdmin(id: string) {
    return this.updateRole(id, "ADMIN");
  }

  /**
   * Remove admin privileges
   */
  async removeAdmin(id: string) {
    return this.updateRole(id, "USER");
  }
}

export const userService = new UserService();
