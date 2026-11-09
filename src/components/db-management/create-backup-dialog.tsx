"use client";

/**
 * Create Backup Dialog Component
 * Dialog for creating a new database backup
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CreateBackupDialogProps {
  databaseName: string;
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  onCreate: (_name: string, _description?: string) => Promise<boolean>;
}

export function CreateBackupDialog({
  databaseName,
  isOpen,
  onOpenChange,
  onCreate,
}: CreateBackupDialogProps) {
  const [backupName, setBackupName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);

    if (!backupName.trim()) {
      setError("Backup name is required");
      return;
    }

    setIsCreating(true);
    try {
      const success = await onCreate(backupName, description);
      if (success) {
        setBackupName("");
        setDescription("");
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create backup");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setBackupName("");
      setDescription("");
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Backup</DialogTitle>
          <DialogDescription>
            Create a backup of the{" "}
            <span className="font-semibold">{databaseName}</span> database.
            Backups are saved to the ./data folder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="backup-name"
              className="text-gray-700 dark:text-gray-300"
            >
              Backup Name
            </Label>
            <Input
              id="backup-name"
              placeholder="e.g., daily_backup_2024"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              disabled={isCreating}
              className="border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-gray-700 dark:text-gray-300"
            >
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add notes about this backup..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              className="min-h-20 resize-none border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !backupName.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isCreating ? "Creating..." : "Create Backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
