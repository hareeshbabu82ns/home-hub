"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import type { TrackItemFilter, TrackAttributeFilter } from "@/types/track";
import type { TrackAttributeValueType } from "@/app/generated/prisma";

interface TrackFilterProps {
  onFilterChange: (_filters: TrackItemFilter) => void;
  initialFilters?: TrackItemFilter;
}

export function TrackFilter({
  onFilterChange,
  initialFilters,
}: TrackFilterProps) {
  const [filters, setFilters] = useState<TrackItemFilter>(initialFilters || {});
  const [showFilters, setShowFilters] = useState(false);

  const updateFilters = (newFilters: Partial<TrackItemFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const updateAttributeFilters = (
    newAttributeFilters: Partial<TrackAttributeFilter>,
  ) => {
    const updatedFilters = {
      ...filters,
      attributes: { ...filters.attributes, ...newAttributeFilters },
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "attributes" && value && typeof value === "object") {
      return Object.values(value).some(
        (attrValue) => attrValue !== undefined && attrValue !== "",
      );
    }
    return value !== undefined && value !== "";
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              Active
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2">
            <X size={16} />
            Clear All
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Track Item Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Track Title</Label>
                <Input
                  id="title"
                  value={filters.title || ""}
                  onChange={(e) => updateFilters({ title: e.target.value })}
                  placeholder="Search by title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={filters.description || ""}
                  onChange={(e) =>
                    updateFilters({ description: e.target.value })
                  }
                  placeholder="Search by description..."
                />
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Created From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={
                    filters.dateFrom
                      ? filters.dateFrom.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFilters({
                      dateFrom: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Created To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={
                    filters.dateTo
                      ? filters.dateTo.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFilters({
                      dateTo: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Attribute Filters */}
            <div className="border-t pt-4">
              <h4 className="mb-3 font-semibold">Attribute Filters</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="attributeTitle">Attribute Name</Label>
                  <Input
                    id="attributeTitle"
                    value={filters.attributes?.attributeTitle || ""}
                    onChange={(e) =>
                      updateAttributeFilters({ attributeTitle: e.target.value })
                    }
                    placeholder="e.g., Weight, Steps..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueType">Value Type</Label>
                  <Select
                    value={filters.attributes?.valueType || ""}
                    onValueChange={(value: TrackAttributeValueType | "") =>
                      updateAttributeFilters({
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="searchText">Search in Attributes</Label>
                  <Input
                    id="searchText"
                    value={filters.attributes?.searchText || ""}
                    onChange={(e) =>
                      updateAttributeFilters({ searchText: e.target.value })
                    }
                    placeholder="Search values..."
                  />
                </div>
              </div>

              {/* Numeric Range Filters */}
              {(filters.attributes?.valueType === "INT" ||
                filters.attributes?.valueType === "FLOAT") && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minValue">Minimum Value</Label>
                    <Input
                      id="minValue"
                      type="number"
                      step={
                        filters.attributes?.valueType === "FLOAT" ? "0.01" : "1"
                      }
                      value={filters.attributes?.minValue?.toString() || ""}
                      onChange={(e) =>
                        updateAttributeFilters({
                          minValue: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Min value"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxValue">Maximum Value</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      step={
                        filters.attributes?.valueType === "FLOAT" ? "0.01" : "1"
                      }
                      value={filters.attributes?.maxValue?.toString() || ""}
                      onChange={(e) =>
                        updateAttributeFilters({
                          maxValue: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Max value"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
