"use client";

import { useEffect, useState } from "react";
import { useMongoDBConnection } from "@/hooks/use-mongodb-connection";
import { useDatabaseManagement } from "@/hooks/use-database-management";
import { MongoDBConnectionModal } from "@/components/db-management/mongodb-connection-modal";
import { DatabaseList } from "@/components/db-management/database-list";
import { CollectionsList } from "@/components/db-management/collections-list";
import { CreateDatabaseDialog } from "@/components/db-management/create-database-dialog";
import { DeleteConfirmDialog } from "@/components/db-management/delete-confirm-dialog";
import { UsersList } from "@/components/db-management/users-list";
import { CreateUserDialog } from "@/components/db-management/create-user-dialog";
import { EditUserDialog } from "@/components/db-management/edit-user-dialog";
import { BackupsList } from "@/components/db-management/backups-list";
import { CreateBackupDialog } from "@/components/db-management/create-backup-dialog";
import { BackupStats } from "@/components/db-management/backup-stats";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogOut, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MongoDBUser } from "@/types/mongodb";

export default function DBManagementPage() {
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [createDbDialogOpen, setCreateDbDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState<MongoDBUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "database" | "collection" | "user";
    name: string;
  } | null>(null);
  const [createBackupDialogOpen, setCreateBackupDialogOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const {
    isConnected,
    isLoading: isConnecting,
    error: connectionError,
    connect,
    disconnect,
    checkConnection,
  } = useMongoDBConnection();

  const {
    databases,
    selectedDatabase,
    collections,
    users,
    backups,
    isLoading: isDbLoading,
    error: dbError,
    selectDatabase,
    refreshDatabases,
    addDatabase,
    removeDatabase,
    refreshCollections,
    removeCollection,
    createDatabaseBackup,
    refreshBackups,
    deleteBackupFile,
    restoreFromBackup,
    refreshUsers,
    addUser,
    removeUser,
    changeUserPassword,
    updateUser,
  } = useDatabaseManagement();

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    setInitialized(true);
  }, [checkConnection]);

  // Refresh databases when connected
  useEffect(() => {
    if (isConnected && initialized) {
      refreshDatabases();
    }
  }, [isConnected, initialized, refreshDatabases]);

  // Refresh collections when database is selected
  useEffect(() => {
    if (isConnected && selectedDatabase) {
      refreshCollections();
      refreshUsers();
      refreshBackups();
    }
  }, [
    isConnected,
    selectedDatabase,
    refreshCollections,
    refreshUsers,
    refreshBackups,
  ]);

  const handleConnect = async (connectionString: string) => {
    await connect(connectionString);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setConnectionModalOpen(false);
  };

  const handleDeleteDatabase = async () => {
    if (!deleteTarget || deleteTarget.type !== "database") return;
    const success = await removeDatabase(deleteTarget.name);
    if (success) {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteTarget || deleteTarget.type !== "collection") return;
    const success = await removeCollection(deleteTarget.name);
    if (success) {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || deleteTarget.type !== "user") return;
    const success = await removeUser(deleteTarget.name);
    if (success) {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleCreateDatabase = async (name: string) => {
    return await addDatabase(name);
  };

  const handleCreateUser = async (
    username: string,
    password: string,
    roles: string[],
    email?: string,
  ) => {
    const success = await addUser(username, password, roles, email);
    if (success) {
      setCreateUserDialogOpen(false);
    }
  };

  const handleEditUser = async (username: string, roles: string[]) => {
    const success = await updateUser(username, roles);
    if (success) {
      setEditUserDialogOpen(false);
      setSelectedUserForEdit(null);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage MongoDB databases, collections, and data
          </p>
        </div>
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                onClick={() => setConnectionModalOpen(true)}
              >
                Manage Connection
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={() => setConnectionModalOpen(true)} size="lg">
              Connect MongoDB
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {isConnected ? "Connected to MongoDB" : "Not Connected"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {connectionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connection Error: {connectionError}
          </AlertDescription>
        </Alert>
      )}

      {dbError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error: {dbError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {isConnected ? (
        <div className="grid gap-6">
          {/* Databases Section */}
          <Card>
            <CardHeader>
              <CardTitle>Databases</CardTitle>
              <CardDescription>
                Manage your MongoDB databases and collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatabaseList
                databases={databases}
                selectedDatabase={selectedDatabase}
                isLoading={isDbLoading}
                onSelect={selectDatabase}
                onDelete={(name) => {
                  setDeleteTarget({ type: "database", name });
                  setDeleteDialogOpen(true);
                }}
                onNew={() => setCreateDbDialogOpen(true)}
                onRefresh={refreshDatabases}
              />
            </CardContent>
          </Card>

          {/* Collections Section */}
          {selectedDatabase && (
            <Card>
              <CardHeader>
                <CardTitle>Collections</CardTitle>
                <CardDescription>
                  Manage collections in <strong>{selectedDatabase.name}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CollectionsList
                  collections={collections}
                  isLoading={isDbLoading}
                  onDelete={(name) => {
                    setDeleteTarget({ type: "collection", name });
                    setDeleteDialogOpen(true);
                  }}
                  onViewStats={() => {
                    // TODO: Implement stats modal
                  }}
                  onRefresh={refreshCollections}
                />
              </CardContent>
            </Card>
          )}

          {/* Users Section */}
          {selectedDatabase && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Manage database users for{" "}
                    <strong>{selectedDatabase.name}</strong>
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateUserDialogOpen(true)} size="sm">
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                <UsersList
                  users={users}
                  loading={isDbLoading}
                  onDelete={(username) => {
                    setDeleteTarget({ type: "user", name: username });
                    setDeleteDialogOpen(true);
                  }}
                  onEdit={(user) => {
                    setSelectedUserForEdit(user);
                    setEditUserDialogOpen(true);
                  }}
                  onRefresh={refreshUsers}
                />
              </CardContent>
            </Card>
          )}

          {/* Backups Section */}
          {selectedDatabase && (
            <>
              <div className="space-y-4">
                <BackupStats backups={backups} />
              </div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Backups</CardTitle>
                    <CardDescription>
                      Manage backups for{" "}
                      <strong>{selectedDatabase.name}</strong>
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setCreateBackupDialogOpen(true)}
                    size="sm"
                  >
                    Create Backup
                  </Button>
                </CardHeader>
                <CardContent>
                  <BackupsList
                    backups={backups}
                    onDelete={deleteBackupFile}
                    onRestore={restoreFromBackup}
                    isLoading={isDbLoading}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Info Card */}
          {databases.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  You are connected to MongoDB! Use the &quot;New Database&quot;
                  button above to create your first database.
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  <li>Create and manage databases</li>
                  <li>View and manage collections</li>
                  <li>Create backups of your data</li>
                  <li>Monitor database statistics</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connect to MongoDB</CardTitle>
            <CardDescription>
              Please connect to a MongoDB instance to manage your databases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setConnectionModalOpen(true)} size="lg">
              Connect Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <MongoDBConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
        onConnect={handleConnect}
        isConnecting={isConnecting}
        error={connectionError}
      />

      <CreateDatabaseDialog
        open={createDbDialogOpen}
        onOpenChange={setCreateDbDialogOpen}
        onCreateSubmit={handleCreateDatabase}
        isLoading={isDbLoading}
        error={dbError}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={
          deleteTarget?.type === "database"
            ? handleDeleteDatabase
            : deleteTarget?.type === "collection"
              ? handleDeleteCollection
              : handleDeleteUser
        }
        itemName={deleteTarget?.name || ""}
        itemType={deleteTarget?.type || "database"}
        isLoading={isDbLoading}
      />

      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        onCreateUser={handleCreateUser}
        loading={isDbLoading}
        error={dbError}
      />

      <EditUserDialog
        open={editUserDialogOpen}
        user={selectedUserForEdit}
        onOpenChange={setEditUserDialogOpen}
        onUpdateUser={handleEditUser}
        loading={isDbLoading}
        error={dbError}
      />

      <CreateBackupDialog
        databaseName={selectedDatabase?.name || ""}
        isOpen={createBackupDialogOpen}
        onOpenChange={setCreateBackupDialogOpen}
        onCreate={async (name: string, description?: string) => {
          const backup = await createDatabaseBackup(name);
          if (backup) {
            await refreshBackups();
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}
