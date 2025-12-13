/**
 * MongoDB Connection Examples and Utilities
 * Reference for common MongoDB connection scenarios
 */

/**
 * Connection String Examples
 *
 * Local MongoDB:
 * mongodb://localhost:27017
 *
 * MongoDB Atlas (Cloud):
 * mongodb+srv://username:password@cluster.mongodb.net/
 *
 * With Database:
 * mongodb://localhost:27017/myDatabase
 *
 * With Authentication:
 * mongodb://username:password@host:27017/database
 *
 * With Options:
 * mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
 */

export const EXAMPLE_CONNECTIONS = {
  LOCAL: "mongodb://localhost:27017",
  LOCAL_WITH_AUTH: "mongodb://username:password@localhost:27017/myDatabase",
  ATLAS: "mongodb+srv://username:password@cluster.mongodb.net/",
  ATLAS_WITH_DB:
    "mongodb+srv://username:password@cluster.mongodb.net/myDatabase",
};

/**
 * System Databases (cannot be deleted)
 */
export const SYSTEM_DATABASES = ["admin", "config", "local"];

/**
 * Validation Functions
 */
export function isValidConnectionString(connectionString: string): boolean {
  if (!connectionString || connectionString.trim().length === 0) {
    return false;
  }

  return (
    connectionString.startsWith("mongodb://") ||
    connectionString.startsWith("mongodb+srv://")
  );
}

export function isValidDatabaseName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 64) return false;
  if (/[/\\. "$*<>:|?]/.test(name)) return false;
  if (SYSTEM_DATABASES.includes(name)) return false;

  return true;
}

export function isValidCollectionName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 120) return false;
  // Reject null char and dots
  if (/[.]/.test(name)) return false;
  if (name.includes("\0")) return false;

  return true;
}

/**
 * Formatting Utilities
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeValue = Math.round((bytes / Math.pow(k, i)) * 100) / 100;
  const sizeUnit = sizes[i];

  return `${sizeValue} ${sizeUnit}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

/**
 * Error Message Helpers
 */
export const ERROR_MESSAGES = {
  CONNECTION_FAILED:
    "Failed to connect to MongoDB. Please check your connection string.",
  INVALID_CONNECTION_STRING: "Invalid MongoDB connection string format.",
  DATABASE_NOT_FOUND: "Database not found.",
  COLLECTION_NOT_FOUND: "Collection not found.",
  PERMISSION_DENIED: "Permission denied. Check your credentials.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  OPERATION_TIMEOUT: "Operation timed out. Please try again.",
  SYSTEM_DATABASE_ERROR: "Cannot perform this operation on system databases.",
};

/**
 * Database Statistics Helper
 */
export interface DatabaseStatsFormatted {
  name: string;
  collections: number;
  dataSize: string;
  storageSize: string;
  indexes: number;
  empty: boolean;
}

export function formatDatabaseStats(
  stats: Record<string, unknown>,
): DatabaseStatsFormatted {
  return {
    name: (stats.db as string) || "unknown",
    collections: (stats.collections as number) || 0,
    dataSize: formatBytes((stats.dataSize as number) || 0),
    storageSize: formatBytes((stats.storageSize as number) || 0),
    indexes: (stats.indexes as number) || 0,
    empty: (stats.empty as boolean) || false,
  };
}
