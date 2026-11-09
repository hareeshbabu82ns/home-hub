/**
 * User Table Component
 * Reusable table for displaying user data with actions
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Shield, UserX, Lock } from "lucide-react";
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

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit?: (user: User) => void;
  onResetPassword?: (userId: string) => void;
  onToggleAdmin?: (userId: string, isAdmin: boolean) => void;
  onToggleStatus?: (userId: string, isActive: boolean) => void;
  onDelete?: (userId: string) => void;
}

export function UserTable({
  users,
  isLoading,
  onEdit,
  onResetPassword,
  onToggleAdmin,
  onToggleStatus,
  onDelete,
}: UserTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onResetPassword && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onResetPassword(user.id)}
                      disabled={isLoading}
                      title="Send password reset email"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  )}
                  {onToggleAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onToggleAdmin(user.id, user.role === "ADMIN")
                      }
                      disabled={isLoading}
                      title={
                        user.role === "ADMIN" ? "Remove admin" : "Make admin"
                      }
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  )}
                  {onToggleStatus && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleStatus(user.id, user.isActive)}
                      disabled={isLoading}
                      title={user.isActive ? "Deactivate" : "Activate"}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(user.id)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
