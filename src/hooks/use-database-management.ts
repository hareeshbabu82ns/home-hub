"use client";

/**
 * Database Management Hook
 * Manages database, collection, backup, and user operations
 */

import { useCallback, useState } from "react";
import {
  listDatabases,
  createDatabase,
  deleteDatabase,
  getCollections,
  dropCollection,
  getDatabaseStats,
  createBackup,
  listBackups,
  getBackup,
  deleteBackup,
  restoreBackup,
  getCollectionStats,
  createUser,
  listUsers,
  deleteUser,
  updateUserPassword,
  updateUserRoles,
} from "@/lib/actions/db-management";
import type {
  DatabaseInfo,
  Backup,
  CollectionStats,
  MongoDBUser,
} from "@/types/mongodb";

interface Collection {
  name: string;
  type: string;
  count: number;
  size: number;
  avgSize: number;
}

interface UseDatabaseManagementReturn {
  databases: DatabaseInfo[];
  selectedDatabase: DatabaseInfo | null;
  collections: Collection[];
  users: MongoDBUser[];
  backups: Backup[];
  isLoading: boolean;
  error: string | null;
  selectDatabase: (_database: DatabaseInfo) => void;
  refreshDatabases: () => Promise<void>;
  addDatabase: (_name: string) => Promise<boolean>;
  removeDatabase: (_name: string) => Promise<boolean>;
  refreshCollections: () => Promise<void>;
  removeCollection: (_collectionName: string) => Promise<boolean>;
  createDatabaseBackup: (
    _backupName: string,
    _collections?: string[],
  ) => Promise<Backup | null>;
  refreshBackups: () => Promise<void>;
  getBackupDetails: (_backupId: string) => Promise<Backup | null>;
  deleteBackupFile: (_backupId: string) => Promise<boolean>;
  restoreFromBackup: (
    _backupId: string,
    _targetDatabase: string,
  ) => Promise<boolean>;
  fetchDatabaseStats: () => Promise<Record<string, unknown> | null>;
  fetchCollectionStats: (
    _collectionName: string,
  ) => Promise<CollectionStats | null>;
  refreshUsers: () => Promise<void>;
  addUser: (
    _username: string,
    _password: string,
    _roles: string[],
    _email?: string,
  ) => Promise<boolean>;
  removeUser: (_username: string) => Promise<boolean>;
  changeUserPassword: (
    _username: string,
    _newPassword: string,
  ) => Promise<boolean>;
  updateUser: (_username: string, _roles: string[]) => Promise<boolean>;
}

export function useDatabaseManagement(): UseDatabaseManagementReturn {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseInfo | null>(
    null,
  );
  const [collections, setCollections] = useState<Collection[]>([]);
  const [users, setUsers] = useState<MongoDBUser[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDatabases = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listDatabases();

      if (result.success && result.data) {
        setDatabases(result.data);
      } else {
        setError(result.error || "Failed to load databases");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading databases";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectDatabase = useCallback((database: DatabaseInfo) => {
    setSelectedDatabase(database);
    setCollections([]);
  }, []);

  const addDatabase = useCallback(
    async (name: string) => {
      setError(null);

      try {
        const result = await createDatabase(name);

        if (result.success && result.data) {
          setDatabases([...databases, result.data]);
          setSelectedDatabase(result.data);
          return true;
        } else {
          setError(result.error || "Failed to create database");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error creating database";
        setError(errorMessage);
        return false;
      }
    },
    [databases],
  );

  const removeDatabase = useCallback(
    async (name: string) => {
      setError(null);

      try {
        const result = await deleteDatabase(name);

        if (result.success) {
          const updated = databases.filter((db) => db.name !== name);
          setDatabases(updated);
          if (selectedDatabase?.name === name) {
            setSelectedDatabase(null);
            setCollections([]);
          }
          return true;
        } else {
          setError(result.error || "Failed to delete database");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error deleting database";
        setError(errorMessage);
        return false;
      }
    },
    [databases, selectedDatabase],
  );

  const refreshCollections = useCallback(async () => {
    if (!selectedDatabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCollections(selectedDatabase.name);

      if (result.success && result.data) {
        setCollections(result.data);
      } else {
        setError(result.error || "Failed to load collections");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading collections";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDatabase]);

  const removeCollection = useCallback(
    async (collectionName: string) => {
      if (!selectedDatabase) return false;

      setError(null);

      try {
        const result = await dropCollection(
          selectedDatabase.name,
          collectionName,
        );

        if (result.success) {
          const updated = collections.filter(
            (col) => col.name !== collectionName,
          );
          setCollections(updated);
          return true;
        } else {
          setError(result.error || "Failed to delete collection");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error deleting collection";
        setError(errorMessage);
        return false;
      }
    },
    [selectedDatabase, collections],
  );

  const createDatabaseBackup = useCallback(
    async (backupName: string, backupCollections?: string[]) => {
      if (!selectedDatabase) return null;

      setError(null);

      try {
        const result = await createBackup(
          selectedDatabase.name,
          backupName,
          backupCollections,
        );

        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || "Failed to create backup");
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error creating backup";
        setError(errorMessage);
        return null;
      }
    },
    [selectedDatabase],
  );

  const refreshBackups = useCallback(async () => {
    setError(null);

    try {
      const result = await listBackups();

      if (result.success && result.data) {
        setBackups(result.data);
      } else {
        setError(result.error || "Failed to load backups");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading backups";
      setError(errorMessage);
    }
  }, []);

  const getBackupDetails = useCallback(async (backupId: string) => {
    setError(null);

    try {
      const result = await getBackup(backupId);

      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || "Failed to get backup details");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error getting backup";
      setError(errorMessage);
      return null;
    }
  }, []);

  const deleteBackupFile = useCallback(
    async (backupId: string) => {
      setError(null);

      try {
        const result = await deleteBackup(backupId);

        if (result.success) {
          const updated = backups.filter((b) => b.id !== backupId);
          setBackups(updated);
          return true;
        } else {
          setError(result.error || "Failed to delete backup");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error deleting backup";
        setError(errorMessage);
        return false;
      }
    },
    [backups],
  );

  const restoreFromBackup = useCallback(
    async (backupId: string, targetDatabase: string) => {
      setError(null);

      try {
        const result = await restoreBackup(backupId, targetDatabase);

        if (result.success) {
          return true;
        } else {
          setError(result.error || "Failed to restore backup");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error restoring backup";
        setError(errorMessage);
        return false;
      }
    },
    [],
  );

  const fetchDatabaseStats = useCallback(async () => {
    if (!selectedDatabase) return null;

    setError(null);

    try {
      const result = await getDatabaseStats(selectedDatabase.name);

      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || "Failed to get stats");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error getting stats";
      setError(errorMessage);
      return null;
    }
  }, [selectedDatabase]);

  const fetchCollectionStats = useCallback(
    async (collectionName: string) => {
      if (!selectedDatabase) return null;

      setError(null);

      try {
        const result = await getCollectionStats(
          selectedDatabase.name,
          collectionName,
        );

        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || "Failed to get collection stats");
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error getting stats";
        setError(errorMessage);
        return null;
      }
    },
    [selectedDatabase],
  );

  const refreshUsers = useCallback(async () => {
    if (!selectedDatabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listUsers(selectedDatabase.name);

      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        setError(result.error || "Failed to load users");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading users";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDatabase]);

  const addUser = useCallback(
    async (
      username: string,
      password: string,
      roles: string[],
      email?: string,
    ) => {
      if (!selectedDatabase) return false;

      setError(null);

      try {
        const result = await createUser(
          selectedDatabase.name,
          username,
          password,
          roles,
          email,
        );

        if (result.success && result.data) {
          setUsers([...users, result.data]);
          return true;
        } else {
          setError(result.error || "Failed to create user");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error creating user";
        setError(errorMessage);
        return false;
      }
    },
    [selectedDatabase, users],
  );

  const removeUser = useCallback(
    async (username: string) => {
      if (!selectedDatabase) return false;

      setError(null);

      try {
        const result = await deleteUser(selectedDatabase.name, username);

        if (result.success) {
          const updated = users.filter((user) => user.username !== username);
          setUsers(updated);
          return true;
        } else {
          setError(result.error || "Failed to delete user");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error deleting user";
        setError(errorMessage);
        return false;
      }
    },
    [selectedDatabase, users],
  );

  const changeUserPassword = useCallback(
    async (username: string, newPassword: string) => {
      if (!selectedDatabase) return false;

      setError(null);

      try {
        const result = await updateUserPassword(
          selectedDatabase.name,
          username,
          newPassword,
        );

        if (result.success) {
          return true;
        } else {
          setError(result.error || "Failed to update password");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error updating password";
        setError(errorMessage);
        return false;
      }
    },
    [selectedDatabase],
  );

  const updateUser = useCallback(
    async (username: string, roles: string[]) => {
      if (!selectedDatabase) return false;

      setError(null);

      try {
        const result = await updateUserRoles(
          selectedDatabase.name,
          username,
          roles,
        );

        if (result.success) {
          setUsers(
            users.map((user) =>
              user.username === username ? { ...user, roles } : user,
            ),
          );
          return true;
        } else {
          setError(result.error || "Failed to update user");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error updating user";
        setError(errorMessage);
        return false;
      }
    },
    [selectedDatabase, users],
  );

  return {
    databases,
    selectedDatabase,
    collections,
    users,
    backups,
    isLoading,
    error,
    selectDatabase,
    refreshDatabases,
    addDatabase,
    removeDatabase,
    refreshCollections,
    removeCollection,
    createDatabaseBackup,
    refreshBackups,
    getBackupDetails,
    deleteBackupFile,
    restoreFromBackup,
    fetchDatabaseStats,
    fetchCollectionStats,
    refreshUsers,
    addUser,
    removeUser,
    changeUserPassword,
    updateUser,
  };
}
