"use client";

/**
 * Restore Dialog Component
 * Dialog for restoring database from backup
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RestoreDialogProps {
  _backupId?: string;
  onOpenChange: (_open: boolean) => void;
  onRestore: (_targetDatabase: string) => Promise<boolean>;
}

export default function RestoreDialog({
  _backupId,
  onOpenChange,
  onRestore,
}: RestoreDialogProps) {
  const [targetDatabase, setTargetDatabase] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async () => {
    setError(null);

    if (!targetDatabase.trim()) {
      setError("Target database name is required");
      return;
    }

    setIsRestoring(true);
    try {
      const success = await onRestore(targetDatabase);
      if (success) {
        setTargetDatabase("");
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore backup");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restore from Backup</DialogTitle>
          <DialogDescription>
            Enter the target database name where you want to restore the backup.
            The database will be created if it doesn&apos;t exist.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            All data in the target database will be overwritten.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="target-db"
              className="text-gray-700 dark:text-gray-300"
            >
              Target Database Name
            </Label>
            <Input
              id="target-db"
              placeholder="e.g., my_restored_db"
              value={targetDatabase}
              onChange={(e) => setTargetDatabase(e.target.value)}
              disabled={isRestoring}
              className="border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isRestoring || !targetDatabase.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isRestoring ? "Restoring..." : "Restore Backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
