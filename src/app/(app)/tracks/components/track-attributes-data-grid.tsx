"use client";

import type {
  TrackAttributes,
  TrackAttributeValueType,
} from "@/app/generated/prisma";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Filter, SortAsc, SortDesc } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TrackAttributeFilter } from "@/types/track";

interface TrackAttributesDataGridProps {
  attributes: TrackAttributes[];
  onEdit?: (_attribute: TrackAttributes) => void;
  onDelete?: (_attribute: TrackAttributes) => void;
  onAdd?: () => void;
  trackId?: string;
}

type SortField = "title" | "valueType" | "createdAt" | "value";
type SortOrder = "asc" | "desc";

const VALUE_TYPE_COLORS: Record<TrackAttributeValueType, string> = {
  STRING: "bg-blue-100 text-blue-800",
  INT: "bg-green-100 text-green-800",
  FLOAT: "bg-yellow-100 text-yellow-800",
  DATETIME: "bg-purple-100 text-purple-800",
  DURATION: "bg-indigo-100 text-indigo-800",
};

export function TrackAttributesDataGrid({
  attributes,
  onEdit,
  onDelete,
  onAdd,
}: TrackAttributesDataGridProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState<TrackAttributeFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const formatValue = (attr: TrackAttributes) => {
    switch (attr.valueType) {
      case "INT":
        return attr.valueInt?.toString() || "N/A";
      case "FLOAT":
        return attr.valueFloat?.toFixed(2) || "N/A";
      case "DATETIME":
        return attr.valueDate
          ? new Date(attr.valueDate).toLocaleString()
          : "N/A";
      case "DURATION":
        if (attr.valueDuration) {
          const hours = Math.floor(attr.valueDuration / 60);
          const minutes = attr.valueDuration % 60;
          return `${hours}h ${minutes}m`;
        }
        return "N/A";
      case "STRING":
      default:
        return attr.value || "N/A";
    }
  };

  const getNumericValue = (attr: TrackAttributes): number => {
    switch (attr.valueType) {
      case "INT":
        return attr.valueInt || 0;
      case "FLOAT":
        return attr.valueFloat || 0;
      case "DURATION":
        return attr.valueDuration || 0;
      case "DATETIME":
        return attr.valueDate ? new Date(attr.valueDate).getTime() : 0;
      case "STRING":
      default:
        return attr.value ? attr.value.length : 0;
    }
  };

  const filteredAndSortedAttributes = React.useMemo(() => {
    const filtered = attributes.filter((attr) => {
      if (
        filters.attributeTitle &&
        !attr.title.toLowerCase().includes(filters.attributeTitle.toLowerCase())
      ) {
        return false;
      }
      if (filters.valueType && attr.valueType !== filters.valueType) {
        return false;
      }
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const value = formatValue(attr).toLowerCase();
        if (
          !attr.title.toLowerCase().includes(searchLower) &&
          !value.includes(searchLower)
        ) {
          return false;
        }
      }
      if (filters.minValue !== undefined || filters.maxValue !== undefined) {
        const numValue = getNumericValue(attr);
        if (filters.minValue !== undefined && numValue < filters.minValue)
          return false;
        if (filters.maxValue !== undefined && numValue > filters.maxValue)
          return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "valueType":
          aValue = a.valueType;
          bValue = b.valueType;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "value":
          aValue = getNumericValue(a);
          bValue = getNumericValue(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [attributes, filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto justify-start p-0 font-semibold"
    >
      {children}
      {sortField === field &&
        (sortOrder === "asc" ? (
          <SortAsc className="ml-1 h-3 w-3" />
        ) : (
          <SortDesc className="ml-1 h-3 w-3" />
        ))}
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Attributes ({filteredAndSortedAttributes.length})
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter size={16} />
            Filter
          </Button>
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus size={16} />
              Add Attribute
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={filters.attributeTitle || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, attributeTitle: e.target.value })
                  }
                  placeholder="Filter by name..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={filters.valueType || ""}
                  onValueChange={(value: TrackAttributeValueType | "") =>
                    setFilters({
                      ...filters,
                      valueType: value as TrackAttributeValueType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="STRING">Text</SelectItem>
                    <SelectItem value="INT">Integer</SelectItem>
                    <SelectItem value="FLOAT">Decimal</SelectItem>
                    <SelectItem value="DATETIME">Date & Time</SelectItem>
                    <SelectItem value="DURATION">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Search</label>
                <Input
                  value={filters.searchText || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, searchText: e.target.value })
                  }
                  placeholder="Search values..."
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium">
                    <SortButton field="title">Name</SortButton>
                  </th>
                  <th className="p-4 text-left font-medium">
                    <SortButton field="valueType">Type</SortButton>
                  </th>
                  <th className="p-4 text-left font-medium">
                    <SortButton field="value">Value</SortButton>
                  </th>
                  <th className="p-4 text-left font-medium">
                    <SortButton field="createdAt">Created</SortButton>
                  </th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAttributes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground p-8 text-center"
                    >
                      No attributes found.{" "}
                      {onAdd && "Click 'Add Attribute' to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedAttributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-muted/25 border-b">
                      <td className="p-4 font-medium">{attr.title}</td>
                      <td className="p-4">
                        <Badge className={VALUE_TYPE_COLORS[attr.valueType]}>
                          {attr.valueType}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-sm">
                        {formatValue(attr)}
                      </td>
                      <td className="text-muted-foreground p-4 text-sm">
                        {formatDistanceToNow(new Date(attr.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(attr)}
                            >
                              <Edit size={14} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(attr)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ({ trackId }: { trackId: string }) => {
//   const attrs =
//     trackId === "new" ? [] : await fetchTrackItemAttributes(trackId);

//   return (
//     <div className="border-border border">
//       <div className="bg-secondary/50 flex min-h-[3rem] items-center justify-between p-4">
//         <div className="flex items-center">
//           <h3 className="text-xl">Attributes</h3>
//         </div>
//         <div className="flex items-center">
//           <Button variant="outline" asChild>
//             <Link href={`/tracks/${trackId}/attributes/new`}>Add</Link>
//           </Button>
//         </div>
//       </div>
//       <div className="p-4">
//         {attrs.length === 0 && <h2>No Attributes, Create some!</h2>}
//         {attrs.map((attr) => (
//           <TrackAttrLine attr={attr} key={attr.id} />
//         ))}
//       </div>
//     </div>
//   );
// };

// function TrackAttrLine({ attr }: { attr: TrackAttributes }) {
//   return <div>{JSON.stringify(attr)}</div>;
// }
