"use client";

import { useEffect, useState } from "react";
import {
  getAllUsers,
  deleteUser,
  resetUserPassword,
  makeAdmin,
  removeAdmin,
  toggleUserStatus,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Shield, UserX, Lock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  emailVerified: Date | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId?: string;
  }>({ open: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success && result.users) {
      setUsers(result.users);
    }
    setLoading(false);
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleResetPassword(userId: string) {
    setActionLoading(userId);
    const result = await resetUserPassword(userId);
    setActionLoading(null);

    if (result.success) {
      toast.success("Password reset email sent");
    } else {
      toast.error(result.error || "Failed to reset password");
    }
  }

  async function handleDeleteUser(userId: string) {
    setActionLoading(userId);
    const result = await deleteUser(userId);
    setActionLoading(null);
    setDeleteDialog({ open: false });

    if (result.success) {
      setUsers(users.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete user");
    }
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    setActionLoading(userId);
    const result = isAdmin
      ? await removeAdmin(userId)
      : await makeAdmin(userId);
    setActionLoading(null);

    if (result.success) {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: isAdmin ? "USER" : "ADMIN" } : u,
        ),
      );
      toast.success(
        isAdmin ? "Admin status removed" : "User promoted to admin",
      );
    } else {
      toast.error(result.error || "Failed to update admin status");
    }
  }

  async function handleToggleStatus(userId: string, isActive: boolean) {
    setActionLoading(userId);
    const result = await toggleUserStatus(userId, !isActive);
    setActionLoading(null);

    if (result.success) {
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u)),
      );
      toast.success(isActive ? "User deactivated" : "User activated");
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left font-semibold">Email</th>
                <th className="text-left font-semibold">Name</th>
                <th className="text-left font-semibold">Role</th>
                <th className="text-left font-semibold">Status</th>
                <th className="text-left font-semibold">Joined</th>
                <th className="text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-3">{user.email}</td>
                  <td className="py-3">{user.name || "-"}</td>
                  <td className="py-3">
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground py-3 text-sm">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResetPassword(user.id)}
                        disabled={actionLoading === user.id}
                        title="Send password reset email"
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleToggleAdmin(user.id, user.role === "ADMIN")
                        }
                        disabled={actionLoading === user.id}
                        title={
                          user.role === "ADMIN" ? "Remove admin" : "Make admin"
                        }
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleToggleStatus(user.id, user.isActive)
                        }
                        disabled={actionLoading === user.id}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDeleteDialog({ open: true, userId: user.id })
                        }
                        disabled={actionLoading === user.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            No users found
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user account will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.userId && handleDeleteUser(deleteDialog.userId)
              }
              disabled={actionLoading !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
