"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AVAILABLE_ROLES, type MongoDBUser } from "@/types/mongodb";

interface EditUserDialogProps {
  open: boolean;
  user: MongoDBUser | null;
  loading?: boolean;
  error?: string | null;
  onOpenChange: (_open: boolean) => void;
  onUpdateUser: (_username: string, _roles: string[]) => Promise<void>;
}

export function EditUserDialog({
  open,
  user,
  loading = false,
  error,
  onOpenChange,
  onUpdateUser,
}: EditUserDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles);
    }
  }, [user, open]);

  const handleUpdateUser = async () => {
    if (!user || selectedRoles.length === 0) {
      return;
    }

    await onUpdateUser(user.username, selectedRoles);
    onOpenChange(false);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const isValid = selectedRoles.length > 0;
  const hasChanged =
    JSON.stringify(selectedRoles) !== JSON.stringify(user?.roles || []);

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Roles</DialogTitle>
          <DialogDescription>
            Update roles for user &quot;{user.username}&quot;
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="bg-muted/30 grid max-h-48 grid-cols-2 gap-3 overflow-y-auto rounded-md border p-2">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                    disabled={loading}
                  />
                  <Label
                    htmlFor={`edit-${role}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {role}
                  </Label>
                </div>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-destructive text-xs">
                Select at least one role
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateUser}
            disabled={!isValid || !hasChanged || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Roles
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
