/**
 * MongoDB Management Types
 * Separated domain for database management operations
 */

export interface MongoDBConnection {
  connectionString: string;
  isConnected: boolean;
  connectedAt?: Date;
  error?: string;
}

export interface DatabaseInfo {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
  collections: number;
  dataSize: number;
  indexes: number;
  avgObjSize: number;
}

export interface Database {
  id: string;
  name: string;
  connectionId: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  collectionCount: number;
}

export interface MongoDBUser {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  databaseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  username: string;
  password: string;
  databaseName: string;
  roles: string[];
  email?: string;
}

export interface UpdateUserInput {
  username: string;
  databaseName: string;
  roles?: string[];
  email?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export const AVAILABLE_ROLES = [
  "read",
  "readWrite",
  "dbAdmin",
  "userAdmin",
  "clusterAdmin",
  "readAnyDatabase",
  "readWriteAnyDatabase",
  "userAdminAnyDatabase",
  "dbOwner",
] as const;

export type UserRole = (typeof AVAILABLE_ROLES)[number];

export interface Backup {
  id: string;
  databaseId: string;
  name: string;
  description?: string;
  size: number;
  backupType: "full" | "incremental";
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  status: "pending" | "completed" | "failed";
  errorMessage?: string;
}

export interface Restore {
  id: string;
  backupId: string;
  databaseId: string;
  targetDatabaseName?: string;
  startedAt: Date;
  completedAt?: Date;
  status: "pending" | "in-progress" | "completed" | "failed";
  errorMessage?: string;
  restoredAt?: Date;
}

export interface Collection {
  name: string;
  type: "collection" | "view";
  count: number;
  size: number;
  avgSize: number;
}

export interface CollectionStats {
  name: string;
  count: number;
  size: number;
  avgSize: number;
  storageSize: number;
  indexes: Record<string, unknown>;
}

export type DBManagementResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
