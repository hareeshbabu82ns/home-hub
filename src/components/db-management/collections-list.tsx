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
import { MoreHorizontal, Trash2, Info } from "lucide-react";

interface Collection {
  name: string;
  type: string;
  count: number;
  size: number;
  avgSize: number;
}

interface CollectionsListProps {
  collections: Collection[];
  isLoading: boolean;
  onDelete: (_collectionName: string) => void;
  onViewStats: (_collectionName: string) => void;
  onRefresh: () => void;
}

export function CollectionsList({
  collections,
  isLoading,
  onDelete,
  onViewStats,
  onRefresh,
}: CollectionsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Collections</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  {isLoading
                    ? "Loading collections..."
                    : "No collections in this database"}
                </TableCell>
              </TableRow>
            ) : (
              collections.map((collection) => (
                <TableRow key={collection.name}>
                  <TableCell className="font-medium">
                    {collection.name}
                  </TableCell>
                  <TableCell>
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {collection.type}
                    </span>
                  </TableCell>
                  <TableCell>{collection.count.toLocaleString()}</TableCell>
                  <TableCell>
                    {collection.size.toLocaleString()} bytes
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewStats(collection.name)}
                        >
                          <Info className="mr-2 h-4 w-4" />
                          View Stats
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(collection.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Collection
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
