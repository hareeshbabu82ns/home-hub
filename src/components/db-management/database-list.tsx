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
import { MoreHorizontal, Trash2, Eye, Plus } from "lucide-react";
import type { DatabaseInfo } from "@/types/mongodb";

interface DatabaseListProps {
  databases: DatabaseInfo[];
  selectedDatabase: DatabaseInfo | null;
  isLoading: boolean;
  onSelect: (_database: DatabaseInfo) => void;
  onDelete: (_databaseName: string) => void;
  onNew: () => void;
  onRefresh: () => void;
}

export function DatabaseList({
  databases,
  selectedDatabase,
  isLoading,
  onSelect,
  onDelete,
  onNew,
  onRefresh,
}: DatabaseListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Databases</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button size="sm" onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Database
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Collections</TableHead>
              <TableHead>Size (bytes)</TableHead>
              <TableHead>Empty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {databases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  {isLoading
                    ? "Loading databases..."
                    : "No databases available"}
                </TableCell>
              </TableRow>
            ) : (
              databases.map((database) => (
                <TableRow
                  key={database.name}
                  className={`hover:bg-muted/50 cursor-pointer ${
                    selectedDatabase?.name === database.name ? "bg-muted" : ""
                  }`}
                  onClick={() => onSelect(database)}
                >
                  <TableCell className="font-medium">{database.name}</TableCell>
                  <TableCell>{database.collections}</TableCell>
                  <TableCell>{database.sizeOnDisk.toLocaleString()}</TableCell>
                  <TableCell>{database.empty ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelect(database)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(database.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Database
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
