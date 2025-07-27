"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { TrackDrawerDialog } from "./edit-drawer-dlg";
import { createTrackItemAttribute } from "../actions";
import type { TrackAttributeValueType } from "@/app/generated/prisma";

interface QuickEntryFormProps {
  trackId?: string;
  defaultTitle?: string;
}

export function QuickEntryForm({ trackId, defaultTitle }: QuickEntryFormProps) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<TrackAttributeValueType>("STRING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trackId) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("trackId", trackId);
      formData.append("title", title.trim());
      formData.append("value", value);
      formData.append("valueType", valueType);

      const result = await createTrackItemAttribute({ message: "" }, formData);

      if (result.success) {
        setTitle("");
        setValue("");
        setValueType("STRING");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating track attribute:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputType = () => {
    switch (valueType) {
      case "INT":
      case "FLOAT":
        return "number";
      case "DATETIME":
        return "datetime-local";
      default:
        return "text";
    }
  };

  const getValuePlaceholder = () => {
    switch (valueType) {
      case "STRING":
        return "Enter text value";
      case "INT":
        return "Enter integer value";
      case "FLOAT":
        return "Enter decimal value";
      case "DATETIME":
        return "Select date and time";
      case "DURATION":
        return "Enter duration in minutes";
      default:
        return "Enter value";
    }
  };

  return (
    <TrackDrawerDialog
      trigger={
        <Button size="sm" className="w-full">
          <Plus className="mr-2 size-4" />
          Quick Add
        </Button>
      }
      title="Quick Add Attribute"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Attribute Name</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter attribute name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valueType">Type</Label>
          <Select
            value={valueType}
            onValueChange={(value) =>
              setValueType(value as TrackAttributeValueType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STRING">Text</SelectItem>
              <SelectItem value="INT">Integer</SelectItem>
              <SelectItem value="FLOAT">Decimal</SelectItem>
              <SelectItem value="DATETIME">Date & Time</SelectItem>
              <SelectItem value="DURATION">Duration (minutes)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            type={getInputType()}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={getValuePlaceholder()}
            step={valueType === "FLOAT" ? "0.01" : undefined}
          />
        </div>

        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? "Adding..." : "Add Attribute"}
        </Button>
      </form>
    </TrackDrawerDialog>
  );
}
