/**
 * Backup Service
 * Handles backup and restore operations with file system storage
 */

import { promises as fs } from "fs";
import path from "path";
import type { MongoClient, Db } from "mongodb";

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  databaseName: string;
  collections: string[];
  size: number;
  createdAt: Date;
  backupType: "full" | "incremental";
  status: "completed" | "failed" | "in-progress";
  errorMessage?: string;
}

export interface BackupFile {
  metadata: BackupMetadata;
  collections: Record<string, unknown[]>;
}

class BackupService {
  /**
   * Initialize backup directory
   */
  async initializeBackupDir(): Promise<void> {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
      console.error("Failed to create backup directory:", error);
    }
  }

  /**
   * Create a database backup
   */
  async createBackup(
    client: MongoClient,
    databaseName: string,
    backupName: string,
    collections?: string[],
    description?: string,
  ): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await this.initializeBackupDir();

      const db = client.db(databaseName);
      const allCollections = collections || (await this.getCollectionNames(db));

      const backupData: Record<string, unknown[]> = {};
      let totalSize = 0;

      // Collect data from each collection
      for (const colName of allCollections) {
        try {
          const collection = db.collection(colName);
          const documents = await collection.find({}).toArray();
          backupData[colName] = documents;

          // Estimate size
          const colSize = JSON.stringify(documents).length;
          totalSize += colSize;
        } catch (error) {
          console.error(`Failed to backup collection ${colName}:`, error);
          // Continue with other collections
        }
      }

      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        description,
        databaseName,
        collections: allCollections,
        size: totalSize,
        createdAt: new Date(),
        backupType: "full",
        status: "completed",
      };

      // Save backup file
      const backupFilePath = path.join(BACKUP_DIR, `${backupId}.json`);
      const backupContent: BackupFile = {
        metadata,
        collections: backupData,
      };

      await fs.writeFile(
        backupFilePath,
        JSON.stringify(backupContent, null, 2),
        "utf-8",
      );

      // Save metadata separately for quick lookup
      const metadataPath = path.join(BACKUP_DIR, `${backupId}.meta.json`);
      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        "utf-8",
      );

      return metadata;
    } catch (error) {
      throw new Error(
        `Failed to create backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      await this.initializeBackupDir();

      const files = await fs.readdir(BACKUP_DIR);
      const metadataFiles = files.filter((f) => f.endsWith(".meta.json"));

      const backups: BackupMetadata[] = [];

      for (const file of metadataFiles) {
        try {
          const filePath = path.join(BACKUP_DIR, file);
          const content = await fs.readFile(filePath, "utf-8");
          const metadata = JSON.parse(content) as BackupMetadata;
          backups.push(metadata);
        } catch (error) {
          console.error(`Failed to read backup metadata ${file}:`, error);
        }
      }

      // Sort by creation date, newest first
      return backups.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("Failed to list backups:", error);
      return [];
    }
  }

  /**
   * Get backup by ID
   */
  async getBackup(backupId: string): Promise<BackupFile | null> {
    try {
      const filePath = path.join(BACKUP_DIR, `${backupId}.json`);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as BackupFile;
    } catch (error) {
      console.error(`Failed to read backup ${backupId}:`, error);
      return null;
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const dataFilePath = path.join(BACKUP_DIR, `${backupId}.json`);
      const metaFilePath = path.join(BACKUP_DIR, `${backupId}.meta.json`);

      try {
        await fs.unlink(dataFilePath);
      } catch {
        // File might not exist
      }

      try {
        await fs.unlink(metaFilePath);
      } catch {
        // File might not exist
      }
    } catch (error) {
      throw new Error(
        `Failed to delete backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Restore a backup to a database
   */
  async restoreBackup(
    client: MongoClient,
    backupId: string,
    targetDatabaseName: string,
  ): Promise<void> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const db = client.db(targetDatabaseName);

      // Restore each collection
      for (const [collectionName, documents] of Object.entries(
        backup.collections,
      )) {
        try {
          const collection = db.collection(collectionName);

          // Clear existing collection
          await collection.deleteMany({});

          // Insert backup data
          if (Array.isArray(documents) && documents.length > 0) {
            await collection.insertMany(documents as Record<string, unknown>[]);
          }
        } catch (error) {
          console.error(
            `Failed to restore collection ${collectionName}:`,
            error,
          );
          throw error;
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to restore backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get backup directory size
   */
  async getBackupDirSize(): Promise<number> {
    try {
      const files = await fs.readdir(BACKUP_DIR);
      let totalSize = 0;

      for (const file of files) {
        try {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // Skip files that can't be read
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Failed to calculate backup directory size:", error);
      return 0;
    }
  }

  /**
   * Get private collection names (excluding system collections)
   */
  private async getCollectionNames(db: Db): Promise<string[]> {
    try {
      const collections = await db.listCollections().toArray();
      return collections
        .map((c) => c.name)
        .filter((name) => !name.startsWith("system."));
    } catch (error) {
      console.error("Failed to list collections:", error);
      return [];
    }
  }
}

export const backupService = new BackupService();
