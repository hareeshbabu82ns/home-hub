/**
 * useUserManagement Hook
 * Manages user-related state and operations
 */

import { useState, useCallback } from "react";
import {
  getAllUsers,
  deleteUser,
  resetUserPassword,
  makeAdmin,
  removeAdmin,
  toggleUserStatus,
} from "@/lib/actions/admin";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  emailVerified: Date | null;
}

interface ActionResult {
  success?: boolean;
  error?: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      }
    } catch (_error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = (await resetUserPassword(userId)) as ActionResult;

      if (result.success) {
        toast.success("Password reset email sent");
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (_error) {
      toast.error("Failed to reset password");
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      setActionLoading(userId);
      try {
        const result = (await deleteUser(userId)) as ActionResult;

        if (result.success) {
          setUsers(users.filter((u) => u.id !== userId));
          toast.success("User deleted successfully");
        } else {
          toast.error(result.error || "Failed to delete user");
        }
      } catch (_error) {
        toast.error("Failed to delete user");
      } finally {
        setActionLoading(null);
      }
    },
    [users],
  );

  const handleToggleAdmin = useCallback(
    async (userId: string, isAdmin: boolean) => {
      setActionLoading(userId);
      try {
        const result = (
          isAdmin ? await removeAdmin(userId) : await makeAdmin(userId)
        ) as ActionResult;

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
      } catch (_error) {
        toast.error("Failed to update admin status");
      } finally {
        setActionLoading(null);
      }
    },
    [users],
  );

  const handleToggleStatus = useCallback(
    async (userId: string, isActive: boolean) => {
      setActionLoading(userId);
      try {
        const result = (await toggleUserStatus(
          userId,
          !isActive,
        )) as ActionResult;

        if (result.success) {
          setUsers(
            users.map((u) =>
              u.id === userId ? { ...u, isActive: !isActive } : u,
            ),
          );
          toast.success(isActive ? "User deactivated" : "User activated");
        } else {
          toast.error(result.error || "Failed to update user status");
        }
      } catch (_error) {
        toast.error("Failed to update user status");
      } finally {
        setActionLoading(null);
      }
    },
    [users],
  );

  return {
    users,
    loading,
    actionLoading,
    loadUsers,
    handleResetPassword,
    handleDeleteUser,
    handleToggleAdmin,
    handleToggleStatus,
  };
}
