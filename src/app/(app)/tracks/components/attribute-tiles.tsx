"use client";

import React, { useState, useEffect, useActionState } from "react";
import { createTrackItemAttribute } from "../actions";
import type {
  TrackAttributes,
  TrackAttributeValueType,
} from "@/app/generated/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Calendar,
  Hash,
  Type,
  Loader2,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttributeTileProps {
  attribute: TrackAttributes;
  lastValues: Map<string, TrackAttributes>;
  onEntryAdded?: () => void;
}

interface AttributeTilesProps {
  attributes: TrackAttributes[];
  trackId: string;
  onEntryAdded?: () => void;
}

const getAttributeIcon = (valueType: TrackAttributeValueType) => {
  switch (valueType) {
    case "INT":
      return <Hash className="size-4" />;
    case "FLOAT":
      return <TrendingUp className="size-4" />;
    case "DATETIME":
      return <Calendar className="size-4" />;
    case "DURATION":
      return <Clock className="size-4" />;
    case "STRING":
    default:
      return <Type className="size-4" />;
  }
};

const getColor = (valueType: TrackAttributeValueType) => {
  switch (valueType) {
    case "STRING":
      return "text-blue-500 border-blue-200 hover:border-blue-300";
    case "INT":
      return "text-green-500 border-green-200 hover:border-green-300";
    case "FLOAT":
      return "text-purple-500 border-purple-200 hover:border-purple-300";
    case "DATETIME":
      return "text-orange-500 border-orange-200 hover:border-orange-300";
    case "DURATION":
      return "text-indigo-500 border-indigo-200 hover:border-indigo-300";
    default:
      return "text-gray-500 border-gray-200 hover:border-gray-300";
  }
};

const getLastValueForType = (
  attribute: TrackAttributes,
  lastValueAttribute?: TrackAttributes,
): string => {
  // For datetime, always start with current time
  if (attribute.valueType === "DATETIME") {
    return new Date().toISOString().slice(0, 16);
  }

  // If we have a last value attribute, extract the appropriate value for auto-fill
  if (lastValueAttribute) {
    switch (attribute.valueType) {
      case "INT":
        return lastValueAttribute.valueInt?.toString() || "";
      case "FLOAT":
        return lastValueAttribute.valueFloat?.toString() || "";
      case "DURATION": {
        // Convert minutes to hours:minutes format
        const minutes = lastValueAttribute.valueDuration || 0;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      }
      case "STRING":
        return ""; // Don't auto-fill strings, start fresh
      default:
        return lastValueAttribute.value?.toString() || "";
    }
  }

  // Fallback to empty values for new entries
  return "";
};

function AttributeTile({
  attribute,
  lastValues,
  onEntryAdded,
}: AttributeTileProps) {
  const lastValue = lastValues.get(`${attribute.title}-${attribute.valueType}`);
  const [value, setValue] = useState(() =>
    getLastValueForType(attribute, lastValue),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [state, formAction] = useActionState(createTrackItemAttribute, {
    message: "",
  });

  // Handle form state changes to show errors
  useEffect(() => {
    if (state?.message && state.message !== "") {
      // If message starts with "Added", it's a success message
      if (state.message.startsWith("Added")) {
        toast.success(state.message);
        // Reset value for next entry, but keep datetime as current time
        if (attribute.valueType === "DATETIME") {
          setValue(new Date().toISOString().slice(0, 16));
        } else if (attribute.valueType === "STRING") {
          setValue(""); // Clear string values after successful submission
        }
        onEntryAdded?.();
      } else {
        toast.error(state.message);
      }
      setIsSubmitting(false);
    }
  }, [state, attribute.valueType, onEntryAdded]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  const getInputType = () => {
    switch (attribute.valueType) {
      case "INT":
        return "number";
      case "FLOAT":
        return "number";
      case "DATETIME":
        return "datetime-local";
      case "DURATION":
        return "text";
      case "STRING":
      default:
        return "text";
    }
  };

  const getInputProps = () => {
    switch (attribute.valueType) {
      case "INT":
        return { step: "1" };
      case "FLOAT":
        return { step: "0.01" };
      case "DURATION":
        return {
          pattern: "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$",
          maxLength: 5,
        };
      default:
        return {};
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle
          className={cn(
            "flex items-center gap-2 text-sm",
            getColor(attribute.valueType),
          )}
        >
          {getAttributeIcon(attribute.valueType)}
          <span className="truncate">{attribute.title}</span>
          <span className="bg-muted ml-auto rounded px-2 py-1 text-xs">
            {attribute.valueType.toLowerCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={handleSubmit} className="space-y-3">
          <input type="hidden" name="trackId" value={attribute.trackId} />
          <input type="hidden" name="title" value={attribute.title} />
          <input type="hidden" name="valueType" value={attribute.valueType} />

          <div className="space-y-1">
            <Label
              htmlFor={`value-${attribute.id}`}
              className="text-muted-foreground text-xs"
            >
              {attribute.valueType === "DATETIME"
                ? "Date & Time"
                : attribute.valueType === "INT"
                  ? "Number (Integer)"
                  : attribute.valueType === "FLOAT"
                    ? "Number (Decimal)"
                    : attribute.valueType === "DURATION"
                      ? "Duration (Hours:Minutes)"
                      : "Text Value"}
            </Label>
            <Input
              id={`value-${attribute.id}`}
              name="value"
              type={getInputType()}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8"
              placeholder={
                attribute.valueType === "DATETIME"
                  ? "Select date & time"
                  : attribute.valueType === "INT"
                    ? "Enter number"
                    : attribute.valueType === "FLOAT"
                      ? "Enter decimal"
                      : attribute.valueType === "DURATION"
                        ? "HH:MM (e.g., 02:30)"
                        : "Enter text"
              }
              {...getInputProps()}
              required
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-8 w-full gap-1"
            disabled={isSubmitting || !value.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Plus className="size-3" />
            )}
            {isSubmitting ? "Adding..." : "Add Entry"}
          </Button>
        </form>

        {lastValue && (
          <div className="text-muted-foreground border-t pt-2 text-xs">
            <span className="font-medium">Last entry:</span>{" "}
            <span className="font-mono">
              {attribute.valueType === "DATETIME" && lastValue.valueDate
                ? lastValue.valueDate.toLocaleString()
                : attribute.valueType === "INT"
                  ? lastValue.valueInt
                  : attribute.valueType === "FLOAT"
                    ? lastValue.valueFloat
                    : attribute.valueType === "DURATION" &&
                        lastValue.valueDuration
                      ? (() => {
                          const minutes = lastValue.valueDuration || 0;
                          const hours = Math.floor(minutes / 60);
                          const mins = minutes % 60;
                          return `${hours}h ${mins}m`;
                        })()
                      : lastValue.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AttributeTiles({
  attributes,
  trackId,
  onEntryAdded,
}: AttributeTilesProps) {
  if (attributes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <BarChart3 className="size-12" />
            <p>No attributes to track yet.</p>
            <p className="text-sm">
              Add some attributes to see quick entry tiles here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique attribute types (title + valueType combinations)
  const uniqueAttributeTypes = new Map<string, TrackAttributes>();

  attributes.forEach((attr) => {
    const key = `${attr.title}-${attr.valueType}`;
    const existing = uniqueAttributeTypes.get(key);

    if (!existing || attr.createdAt > existing.createdAt) {
      uniqueAttributeTypes.set(key, attr);
    }
  });

  // Create template attributes for tiles (these will be used for new entries)
  const templateAttributes = Array.from(uniqueAttributeTypes.values()).map(
    (attr) => ({
      ...attr,
      id: `template-${attr.title}-${attr.valueType}`, // Template ID
      trackId, // Ensure trackId is set correctly for new entries
      value: null,
      valueInt: null,
      valueFloat: null,
      valueDate: null,
    }),
  );

  // Create a map of last values for each attribute type
  const lastValuesMap = new Map<string, TrackAttributes>();
  Array.from(uniqueAttributeTypes.entries()).forEach(([key, attr]) => {
    lastValuesMap.set(key, attr);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground size-5" />
          <h3 className="text-lg font-semibold">Quick Entry</h3>
        </div>
        <span className="text-muted-foreground text-sm">
          {templateAttributes.length} attribute
          {templateAttributes.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templateAttributes.map((attr) => (
          <AttributeTile
            key={`${attr.title}-${attr.valueType}`}
            attribute={attr}
            lastValues={lastValuesMap}
            onEntryAdded={onEntryAdded}
          />
        ))}
      </div>
    </div>
  );
}
