"use client";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Trash2, Edit } from "lucide-react";
import type { MongoDBUser } from "@/types/mongodb";

interface UsersListProps {
  users: MongoDBUser[];
  loading?: boolean;
  onDelete: (_username: string) => void;
  onEdit: (_user: MongoDBUser) => void;
  onRefresh: () => void;
}

export function UsersList({
  users,
  loading = false,
  onDelete,
  onEdit,
  onRefresh,
}: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className="border-border rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No users found for this database
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.email || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      No roles
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      className="h-8 w-8 p-0"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(user)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(user.username)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
