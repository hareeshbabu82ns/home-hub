"use client";

/**
 * Backups List Component
 * Displays all database backups with actions
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { Backup } from "@/types/mongodb";
import RestoreDialog from "./restore-dialog";

interface BackupsListProps {
  backups: Backup[];
  onDelete: (_backupId: string) => Promise<boolean>;
  onRestore: (_backupId: string, _targetDatabase: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function BackupsList({
  backups,
  onDelete,
  onRestore,
  isLoading,
}: BackupsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const success = await onDelete(deleteId);
      if (success) {
        setDeleteId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (backups.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        <p>No backups found. Create your first backup to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="text-gray-700 dark:text-gray-300">
                Name
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Database
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Size
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Type
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Created
              </TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((backup) => (
              <TableRow
                key={backup.id}
                className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
              >
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {backup.name}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {backup.databaseId}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {formatFileSize(backup.size)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {backup.backupType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      backup.status === "completed"
                        ? "default"
                        : backup.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {backup.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(backup.createdAt)}
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestoreId(backup.id)}
                    disabled={isLoading || isDeleting}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(backup.id)}
                    disabled={isLoading || isDeleting}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open: boolean) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      {restoreId && (
        <RestoreDialog
          _backupId={restoreId}
          onOpenChange={(open: boolean) => !open && setRestoreId(null)}
          onRestore={async (targetDb: string) => {
            const success = await onRestore(restoreId, targetDb);
            if (success) {
              setRestoreId(null);
            }
            return success;
          }}
        />
      )}
    </>
  );
}
