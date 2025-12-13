/**
 * MongoDB Management Service
 * Business logic for database, user, backup, and restore operations
 * Pure functions, no framework dependencies
 */

import { MongoClient } from "mongodb";
import type {
  DatabaseInfo,
  MongoDBUser,
  Backup,
  Restore,
  Collection,
  CollectionStats,
} from "@/types/mongodb";

// Store connection in a singleton pattern
let mongoClient: MongoClient | null = null;

class MongoDBService {
  /**
   * Connect to MongoDB instance
   */
  async connect(connectionString: string): Promise<boolean> {
    try {
      if (mongoClient) {
        await mongoClient.close();
      }

      mongoClient = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000,
      });

      await mongoClient.connect();

      // Verify connection by pinging admin
      const adminDb = mongoClient.db("admin");
      await adminDb.command({ ping: 1 });

      return true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error(
        `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return mongoClient !== null;
  }

  /**
   * Get the MongoDB client
   */
  private getClient(): MongoClient {
    if (!mongoClient) throw new Error("Not connected to MongoDB");
    return mongoClient;
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
    }
  }

  /**
   * Get list of all databases
   */
  async listDatabases(): Promise<DatabaseInfo[]> {
    const client = this.getClient();

    try {
      const adminDb = client.db("admin");
      const result = await adminDb.admin().listDatabases();

      const databases: DatabaseInfo[] = [];

      for (const dbInfo of result.databases) {
        const db = client.db(dbInfo.name);
        const stats = await db
          .stats()
          .catch(() => ({}) as Record<string, unknown>);

        databases.push({
          name: dbInfo.name,
          sizeOnDisk: (dbInfo.sizeOnDisk ?? 0) as number,
          empty: dbInfo.empty ?? false,
          collections: (stats.collections ?? 0) as number,
          dataSize: (stats.dataSize ?? 0) as number,
          indexes: (stats.indexes ?? 0) as number,
          avgObjSize: (stats.avgObjSize ?? 0) as number,
        });
      }

      return databases;
    } catch (error) {
      throw new Error(
        `Failed to list databases: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a new database
   */
  async createDatabase(databaseName: string): Promise<DatabaseInfo> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      // Create a dummy document to ensure database is created
      const collection = db.collection("__init__");
      const result = await collection.insertOne({
        init: true,
      });
      // Remove the init collection
      await db.collection("__init__").deleteOne({ _id: result.insertedId });

      const stats = await db
        .stats()
        .catch(() => ({}) as Record<string, unknown>);

      return {
        name: databaseName,
        sizeOnDisk: (stats.sizeOnDisk ?? 0) as number,
        empty: false,
        collections: (stats.collections ?? 0) as number,
        dataSize: (stats.dataSize ?? 0) as number,
        indexes: (stats.indexes ?? 0) as number,
        avgObjSize: (stats.avgObjSize ?? 0) as number,
      };
    } catch (error) {
      throw new Error(
        `Failed to create database: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a database
   */
  async deleteDatabase(databaseName: string): Promise<void> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      await db.dropDatabase();
    } catch (error) {
      throw new Error(
        `Failed to delete database: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Rename a database
   */
  async renameDatabase(_oldName: string, _newName: string): Promise<void> {
    // MongoDB doesn't support direct renaming, would need to copy and delete
    throw new Error(
      "Database renaming requires copying all data - use export/import instead",
    );
  }

  /**
   * Get collections in a database
   */
  async getCollections(databaseName: string): Promise<Collection[]> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      const collections = await db.listCollections().toArray();

      const result: Collection[] = [];

      for (const collInfo of collections) {
        const collection = db.collection(collInfo.name);
        const count = await collection.countDocuments();

        const colType: "collection" | "view" =
          (collInfo.type as "collection" | "view") || "collection";
        result.push({
          name: collInfo.name,
          type: colType,
          count,
          size: 0, // Size not directly available in modern MongoDB driver
          avgSize: 0,
        });
      }

      return result;
    } catch (error) {
      throw new Error(
        `Failed to get collections: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a MongoDB user using admin command
   */
  async createUser(
    databaseName: string,
    username: string,
    password: string,
    roles: string[],
  ): Promise<MongoDBUser> {
    const client = this.getClient();

    try {
      const adminDb = client.db("admin");

      // Create user with specified roles
      await adminDb.command({
        createUser: username,
        pwd: password,
        roles: roles.map((role) => ({
          role,
          db: databaseName,
        })),
      });

      return {
        id: `user-${username}-${Date.now()}`,
        username,
        roles,
        databaseId: databaseName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * List users for a database by querying the system.users collection
   */
  async listUsers(databaseName: string): Promise<MongoDBUser[]> {
    const client = this.getClient();

    try {
      const adminDb = client.db("admin");

      // Query the system.users collection
      const usersCollection = adminDb.collection("system.users");
      const users = await usersCollection.find({ db: databaseName }).toArray();

      return users.map((doc: Record<string, unknown>) => ({
        id: String(doc._id),
        username: String(doc.user),
        email: doc.email ? String(doc.email) : undefined,
        roles: Array.isArray(doc.roles)
          ? (doc.roles as Array<Record<string, string>>).map((r) => r.role)
          : [],
        databaseId: databaseName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error) {
      // If access is denied, return empty array gracefully
      if (error instanceof Error && error.message.includes("not authorized")) {
        return [];
      }
      throw new Error(
        `Failed to list users: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(databaseName: string, username: string): Promise<void> {
    const client = this.getClient();

    try {
      const adminDb = client.db("admin");
      await adminDb.command({
        dropUser: username,
        writeConcern: { w: 1 },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(
    databaseName: string,
    username: string,
    newPassword: string,
  ): Promise<void> {
    const client = this.getClient();

    try {
      const adminDb = client.db("admin");
      await adminDb.command({
        updateUser: username,
        pwd: newPassword,
        writeConcern: { w: 1 },
      });
    } catch (error) {
      throw new Error(
        `Failed to update password: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update user roles
   */
  async updateUserRoles(
    databaseName: string,
    username: string,
    roles: string[],
  ): Promise<void> {
    const client = this.getClient();

    try {
      const adminDb = client.db("admin");
      await adminDb.command({
        updateUser: username,
        roles: roles.map((role) => ({
          role,
          db: databaseName,
        })),
        writeConcern: { w: 1 },
      });
    } catch (error) {
      throw new Error(
        `Failed to update roles: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a backup (export collection data)
   */
  async createBackup(
    databaseName: string,
    backupName: string,
    collections?: string[],
  ): Promise<Backup> {
    const client = this.getClient();

    try {
      const { backupService } = await import("./backup.service");
      const metadata = await backupService.createBackup(
        client,
        databaseName,
        backupName,
        collections,
      );

      return {
        id: metadata.id,
        databaseId: databaseName,
        name: backupName,
        size: metadata.size,
        backupType: metadata.backupType,
        createdAt: metadata.createdAt,
        updatedAt: metadata.createdAt,
        status: metadata.status as "completed" | "failed" | "pending",
      };
    } catch (error) {
      throw new Error(
        `Failed to create backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * List backups
   */
  async listBackups(_databaseName?: string): Promise<Backup[]> {
    try {
      const { backupService } = await import("./backup.service");
      const backups = await backupService.listBackups();

      return backups.map((b) => ({
        id: b.id,
        databaseId: b.databaseName,
        name: b.name,
        description: b.description,
        size: b.size,
        backupType: b.backupType,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
        status: b.status as "completed" | "failed" | "pending",
      }));
    } catch (error) {
      console.error("Failed to list backups:", error);
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const { backupService } = await import("./backup.service");
      await backupService.deleteBackup(backupId);
    } catch (error) {
      throw new Error(
        `Failed to delete backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    backupId: string,
    targetDatabase: string,
  ): Promise<Restore> {
    const client = this.getClient();

    try {
      const { backupService } = await import("./backup.service");
      await backupService.restoreBackup(client, backupId, targetDatabase);

      return {
        id: `restore-${Date.now()}`,
        backupId,
        databaseId: targetDatabase,
        startedAt: new Date(),
        completedAt: new Date(),
        status: "completed",
      };
    } catch (error) {
      throw new Error(
        `Failed to restore backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(
    databaseName: string,
  ): Promise<Record<string, unknown>> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      return await db.stats();
    } catch (error) {
      throw new Error(
        `Failed to get stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(
    databaseName: string,
    collectionName: string,
  ): Promise<CollectionStats> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();

      return {
        name: collectionName,
        count,
        size: 0,
        avgSize: 0,
        storageSize: 0,
        indexes: {},
      };
    } catch (error) {
      throw new Error(
        `Failed to get collection stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get collection document count
   */
  async getCollectionCount(
    databaseName: string,
    collectionName: string,
  ): Promise<number> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      const collection = db.collection(collectionName);
      return await collection.countDocuments();
    } catch (error) {
      throw new Error(
        `Failed to get collection count: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Drop a collection
   */
  async dropCollection(
    databaseName: string,
    collectionName: string,
  ): Promise<void> {
    const client = this.getClient();

    try {
      const db = client.db(databaseName);
      await db.collection(collectionName).drop();
    } catch (error) {
      throw new Error(
        `Failed to drop collection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const mongoDBService = new MongoDBService();
