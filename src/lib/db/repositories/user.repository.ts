/**
 * User Repository
 * Handles all database operations related to users
 * This layer should only contain database queries and mutations
 */

import { db } from "@/lib/db";
import type { $Enums } from "@/app/generated/prisma";

type UserRole = $Enums.UserRole;

export const userRepository = {
  // Find operations
  findById: async (id: string) => {
    return db.user.findUnique({
      where: { id },
    });
  },

  findByEmail: async (email: string) => {
    return db.user.findUnique({
      where: { email },
    });
  },

  findAll: async () => {
    return db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  countByRole: async (role: UserRole) => {
    return db.user.count({
      where: { role },
    });
  },

  // Create operations
  create: async (data: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
  }) => {
    return db.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || "USER",
      },
    });
  },

  // Update operations
  update: async (
    id: string,
    data: {
      name?: string;
      password?: string;
      role?: UserRole;
      isActive?: boolean;
      image?: string;
    },
  ) => {
    return db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  },

  updateRole: async (id: string, role: UserRole) => {
    return db.user.update({
      where: { id },
      data: { role },
    });
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    return db.user.update({
      where: { id },
      data: { isActive },
    });
  },

  // Delete operations
  delete: async (id: string) => {
    return db.user.delete({
      where: { id },
    });
  },

  // Password operations
  updatePassword: async (id: string, hashedPassword: string) => {
    return db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  },
};
