/**
 * User Management Utilities
 * Helper functions for user operations
 */

import { AVAILABLE_ROLES } from "@/types/mongodb";

export const USER_ROLE_DESCRIPTIONS: Record<string, string> = {
  read: "Read data from the database",
  readWrite: "Read and write data to the database",
  dbAdmin: "Administer the database",
  userAdmin: "Manage users in the database",
  clusterAdmin: "Administer the entire cluster",
  readAnyDatabase: "Read data from any database",
  readWriteAnyDatabase: "Read and write data in any database",
  userAdminAnyDatabase: "Manage users in any database",
  dbOwner: "Full control over database and users",
};

export const USER_ROLE_CATEGORIES = {
  basic: ["read", "readWrite"],
  admin: ["dbAdmin", "userAdmin", "dbOwner"],
  cluster: [
    "clusterAdmin",
    "readAnyDatabase",
    "readWriteAnyDatabase",
    "userAdminAnyDatabase",
  ],
} as const;

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  if (!username || username.length === 0) return false;
  if (username.length > 64) return false;
  // Username can contain letters, numbers, underscores, dots, and hyphens
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(username);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  if (!password || password.length < 6) return false;
  // Could add more requirements like uppercase, numbers, special chars
  return true;
}

/**
 * Get role display label
 */
export function getRoleLabel(role: string): string {
  return USER_ROLE_DESCRIPTIONS[role] || role;
}

/**
 * Get roles in a category
 */
export function getRolesByCategory(
  category: "basic" | "admin" | "cluster",
): readonly string[] {
  return USER_ROLE_CATEGORIES[category];
}

/**
 * Suggest roles based on use case
 */
export function suggestRoles(useCase: string): string[] {
  switch (useCase) {
    case "read-only":
      return ["read"];
    case "developer":
      return ["readWrite"];
    case "admin":
      return ["dbAdmin", "userAdmin"];
    case "cluster-admin":
      return ["clusterAdmin"];
    default:
      return ["read"];
  }
}

/**
 * Format user display name
 */
export function formatUserDisplay(username: string, email?: string): string {
  if (email) {
    return `${username} (${email})`;
  }
  return username;
}

/**
 * Check if role is dangerous (admin/cluster)
 */
export function isDangerousRole(role: string): boolean {
  return (
    USER_ROLE_CATEGORIES.admin.includes(role as never) ||
    USER_ROLE_CATEGORIES.cluster.includes(role as never)
  );
}

/**
 * Get all available roles
 */
export function getAllRoles(): string[] {
  return [...AVAILABLE_ROLES];
}

/**
 * Validate user creation input
 */
export interface UserValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateUserInput(
  username: string,
  password: string,
  roles: string[],
): UserValidationResult {
  const errors: string[] = [];

  if (!isValidUsername(username)) {
    errors.push("Invalid username format");
  }

  if (!isStrongPassword(password)) {
    errors.push("Password must be at least 6 characters");
  }

  if (roles.length === 0) {
    errors.push("At least one role must be selected");
  }

  const validRoles = new Set(AVAILABLE_ROLES);
  for (const role of roles) {
    if (!validRoles.has(role as never)) {
      errors.push(`Invalid role: ${role}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare role sets (for change detection)
 */
export function rolesChanged(oldRoles: string[], newRoles: string[]): boolean {
  const oldSet = new Set(oldRoles);
  const newSet = new Set(newRoles);

  if (oldSet.size !== newSet.size) {
    return true;
  }

  for (const role of oldSet) {
    if (!newSet.has(role)) {
      return true;
    }
  }

  return false;
}
