"use server";

/**
 * MongoDB Management Server Actions
 * Controllers for database, user, backup, and restore operations
 */

import { mongoDBService } from "@/lib/services/mongodb.service";
import type {
  DBManagementResponse,
  DatabaseInfo,
  Backup,
  MongoDBUser,
} from "@/types/mongodb";

/**
 * Connect to MongoDB
 */
export async function connectMongoDB(
  connectionString: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    // Basic validation
    if (!connectionString || connectionString.trim().length === 0) {
      return { success: false, error: "Connection string is required" };
    }

    if (
      !connectionString.startsWith("mongodb://") &&
      !connectionString.startsWith("mongodb+srv://")
    ) {
      return {
        success: false,
        error: "Invalid MongoDB connection string format",
      };
    }

    const result = await mongoDBService.connect(connectionString);
    return { success: result, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to connect to MongoDB",
    };
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectMongoDB(): Promise<
  DBManagementResponse<boolean>
> {
  try {
    await mongoDBService.disconnect();
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disconnect",
    };
  }
}

/**
 * Check connection status
 */
export async function checkMongoDBConnection(): Promise<
  DBManagementResponse<boolean>
> {
  try {
    const isConnected = mongoDBService.isConnected();
    return { success: true, data: isConnected };
  } catch (_error) {
    return { success: false, data: false };
  }
}

/**
 * List all databases
 */
export async function listDatabases(): Promise<
  DBManagementResponse<DatabaseInfo[]>
> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    const databases = await mongoDBService.listDatabases();
    return { success: true, data: databases };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list databases",
    };
  }
}

/**
 * Create a new database
 */
export async function createDatabase(
  databaseName: string,
): Promise<DBManagementResponse<DatabaseInfo>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    // Validate database name (MongoDB constraints)
    if (databaseName.length > 64) {
      return {
        success: false,
        error: "Database name must be less than 64 characters",
      };
    }

    if (/[/\\. "$*<>:|?]/.test(databaseName)) {
      return {
        success: false,
        error: "Database name contains invalid characters",
      };
    }

    const database = await mongoDBService.createDatabase(databaseName);
    return { success: true, data: database };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create database",
    };
  }
}

/**
 * Delete a database
 */
export async function deleteDatabase(
  databaseName: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    // Prevent deletion of system databases
    if (["admin", "config", "local"].includes(databaseName)) {
      return { success: false, error: "Cannot delete system databases" };
    }

    await mongoDBService.deleteDatabase(databaseName);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete database",
    };
  }
}

/**
 * Get collections in a database
 */
export async function getCollections(databaseName: string): Promise<
  DBManagementResponse<
    Array<{
      name: string;
      type: string;
      count: number;
      size: number;
      avgSize: number;
    }>
  >
> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    const collections = await mongoDBService.getCollections(databaseName);
    return { success: true, data: collections };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get collections",
    };
  }
}

/**
 * Drop a collection
 */
export async function dropCollection(
  databaseName: string,
  collectionName: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || !collectionName) {
      return {
        success: false,
        error: "Database and collection names are required",
      };
    }

    await mongoDBService.dropCollection(databaseName, collectionName);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to drop collection",
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(
  databaseName: string,
): Promise<DBManagementResponse<Record<string, unknown>>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    const stats = await mongoDBService.getDatabaseStats(databaseName);
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get database stats",
    };
  }
}

/**
 * Create a backup
 */
export async function createBackup(
  databaseName: string,
  backupName: string,
  collections?: string[],
): Promise<DBManagementResponse<Backup>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || !backupName) {
      return {
        success: false,
        error: "Database name and backup name are required",
      };
    }

    const backup = await mongoDBService.createBackup(
      databaseName,
      backupName,
      collections,
    );
    return { success: true, data: backup };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create backup",
    };
  }
}

/**
 * List all backups
 */
export async function listBackups(
  databaseName?: string,
): Promise<DBManagementResponse<Backup[]>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    const backups = await mongoDBService.listBackups(databaseName);
    return { success: true, data: backups };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list backups",
    };
  }
}

/**
 * Get a specific backup
 */
export async function getBackup(
  backupId: string,
): Promise<DBManagementResponse<Backup>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!backupId || backupId.trim().length === 0) {
      return { success: false, error: "Backup ID is required" };
    }

    // Fetch all backups and find the one matching the ID
    const backups = await mongoDBService.listBackups();
    const backup = backups.find((b) => b.id === backupId);

    if (!backup) {
      return { success: false, error: "Backup not found" };
    }

    return { success: true, data: backup };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get backup",
    };
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(
  backupId: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!backupId || backupId.trim().length === 0) {
      return { success: false, error: "Backup ID is required" };
    }

    await mongoDBService.deleteBackup(backupId);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete backup",
    };
  }
}

/**
 * Restore from a backup
 */
export async function restoreBackup(
  backupId: string,
  targetDatabase: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!backupId || backupId.trim().length === 0) {
      return { success: false, error: "Backup ID is required" };
    }

    if (!targetDatabase || targetDatabase.trim().length === 0) {
      return { success: false, error: "Target database name is required" };
    }

    await mongoDBService.restoreFromBackup(backupId, targetDatabase);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to restore backup",
    };
  }
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(
  databaseName: string,
  collectionName: string,
): Promise<
  DBManagementResponse<{
    name: string;
    count: number;
    size: number;
    avgSize: number;
    storageSize: number;
    indexes: Record<string, unknown>;
  }>
> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    const stats = await mongoDBService.getCollectionStats(
      databaseName,
      collectionName,
    );
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get collection stats",
    };
  }
}

/**
 * Create a new MongoDB user
 */
export async function createUser(
  databaseName: string,
  username: string,
  password: string,
  roles: string[],
  email?: string,
): Promise<DBManagementResponse<MongoDBUser>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    // Validation
    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    if (!username || username.trim().length === 0) {
      return { success: false, error: "Username is required" };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };
    }

    if (!roles || roles.length === 0) {
      return { success: false, error: "At least one role must be selected" };
    }

    const user = await mongoDBService.createUser(
      databaseName,
      username,
      password,
      roles,
    );

    if (email) {
      user.email = email;
    }

    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * List all users for a database
 */
export async function listUsers(
  databaseName: string,
): Promise<DBManagementResponse<MongoDBUser[]>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    const users = await mongoDBService.listUsers(databaseName);
    return { success: true, data: users };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list users",
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(
  databaseName: string,
  username: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    if (!username || username.trim().length === 0) {
      return { success: false, error: "Username is required" };
    }

    await mongoDBService.deleteUser(databaseName, username);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  databaseName: string,
  username: string,
  newPassword: string,
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    if (!username || username.trim().length === 0) {
      return { success: false, error: "Username is required" };
    }

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };
    }

    await mongoDBService.updateUserPassword(
      databaseName,
      username,
      newPassword,
    );
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
}

/**
 * Update user roles
 */
export async function updateUserRoles(
  databaseName: string,
  username: string,
  roles: string[],
): Promise<DBManagementResponse<boolean>> {
  try {
    if (!mongoDBService.isConnected()) {
      return { success: false, error: "Not connected to MongoDB" };
    }

    if (!databaseName || databaseName.trim().length === 0) {
      return { success: false, error: "Database name is required" };
    }

    if (!username || username.trim().length === 0) {
      return { success: false, error: "Username is required" };
    }

    if (!roles || roles.length === 0) {
      return { success: false, error: "At least one role must be selected" };
    }

    await mongoDBService.updateUserRoles(databaseName, username, roles);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update roles",
    };
  }
}
