"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AVAILABLE_ROLES } from "@/types/mongodb";

interface CreateUserDialogProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onOpenChange: (_open: boolean) => void;
  onCreateUser: (
    _username: string,
    _password: string,
    _roles: string[],
    _email?: string,
  ) => Promise<void>;
}

export function CreateUserDialog({
  open,
  loading = false,
  error,
  onOpenChange,
  onCreateUser,
}: CreateUserDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    if (selectedRoles.length === 0) {
      return;
    }

    await onCreateUser(username, password, selectedRoles, email || undefined);

    setUsername("");
    setPassword("");
    setEmail("");
    setSelectedRoles([]);
    onOpenChange(false);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const isValid =
    username.trim().length > 0 &&
    password.trim().length >= 6 &&
    selectedRoles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user for the selected database with specific roles.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-muted-foreground text-xs">
              Minimum 6 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="bg-muted/30 grid max-h-48 grid-cols-2 gap-3 overflow-y-auto rounded-md border p-2">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                    disabled={loading}
                  />
                  <Label
                    htmlFor={role}
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
          <Button onClick={handleCreateUser} disabled={!isValid || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
