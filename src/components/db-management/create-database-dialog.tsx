"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface CreateDatabaseDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onCreateSubmit: (_name: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function CreateDatabaseDialog({
  open,
  onOpenChange,
  onCreateSubmit,
  isLoading,
  error,
}: CreateDatabaseDialogProps) {
  const [databaseName, setDatabaseName] = useState("");

  const handleCreate = async () => {
    if (!databaseName.trim()) {
      return;
    }
    const success = await onCreateSubmit(databaseName);
    if (success) {
      setDatabaseName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create Database</DialogTitle>
          <DialogDescription>
            Enter a name for your new MongoDB database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="db-name">Database Name</Label>
            <Input
              id="db-name"
              placeholder="my_database"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading || !databaseName.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
