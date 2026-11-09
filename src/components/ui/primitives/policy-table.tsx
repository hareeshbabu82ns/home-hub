/**
 * Registration Policy Table Component
 * Reusable table for displaying registration policies
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
import { Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface RegistrationPolicy {
  id: string;
  type: string;
  value: string;
  isAllowed: boolean;
  createdAt: Date;
}

interface PolicyTableProps {
  policies: RegistrationPolicy[];
  isLoading: boolean;
  onEdit?: (policy: RegistrationPolicy) => void;
  onDelete?: (policyId: string) => void;
}

export function PolicyTable({
  policies,
  isLoading,
  onEdit,
  onDelete,
}: PolicyTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id}>
              <TableCell>
                <Badge variant="outline">{policy.type}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{policy.value}</TableCell>
              <TableCell>
                <Badge
                  variant={policy.isAllowed ? "default" : "destructive"}
                >
                  {policy.isAllowed ? "Allowed" : "Blocked"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(policy.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(policy)}
                      disabled={isLoading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(policy.id)}
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
