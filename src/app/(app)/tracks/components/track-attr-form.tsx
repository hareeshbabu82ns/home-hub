"use client";

import type {
  TrackAttributes,
  TrackAttributeValueType,
} from "@/app/generated/prisma";
import React, { useState, useEffect, useActionState } from "react";
import { LucideSave as SaveIcon, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createTrackItemAttribute, updateTrackItemAttribute } from "../actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AttributeTitleCombobox } from "./attribute-title-combobox";
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

interface TrackAttrFormProps {
  attr: TrackAttributes;
  className: string;
  trackId?: string;
  onSuccess?: () => void;
}

const initialState = {
  message: "",
  success: false,
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      size="sm"
      type="submit"
      disabled={pending || disabled}
      className="w-fit"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      <SaveIcon size={16} />
      Save
    </Button>
  );
}

const TrackAttributeForm = ({
  attr,
  className,
  trackId,
  onSuccess,
}: TrackAttrFormProps) => {
  const [state, formAction] = useActionState(
    attr?.id === "new" ? createTrackItemAttribute : updateTrackItemAttribute,
    initialState,
  );

  const [valueType, setValueType] = useState<TrackAttributeValueType>(
    attr?.valueType || "STRING",
  );
  const [title, setTitle] = useState(attr?.title || "");

  // Handle form submission results
  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
        onSuccess?.();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, onSuccess]);

  // Update title when attr changes (for editing mode)
  useEffect(() => {
    if (attr?.title) {
      setTitle(attr.title);
    }
  }, [attr?.title]);

  // Validate form before submission
  const handleFormAction = async (formData: FormData) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    // Form is valid, proceed with submission
    formAction(formData);
  };

  const getCurrentValue = () => {
    switch (valueType) {
      case "INT":
        return attr?.valueInt?.toString() || "";
      case "FLOAT":
        return attr?.valueFloat?.toString() || "";
      case "DATETIME":
        return attr?.valueDate
          ? new Date(attr.valueDate).toISOString().slice(0, 16)
          : "";
      case "DURATION":
        if (attr?.valueDuration) {
          const hours = Math.floor(attr.valueDuration / 60);
          const minutes = attr.valueDuration % 60;
          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
        return "";
      case "STRING":
      default:
        return attr?.value || "";
    }
  };

  const getInputType = () => {
    switch (valueType) {
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
    switch (valueType) {
      case "INT":
        return { step: "1" };
      case "FLOAT":
        return { step: "0.01" };
      case "DURATION":
        return {
          pattern: "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$",
          placeholder: "HH:MM (e.g., 02:30)",
          maxLength: 5,
        };
      default:
        return {};
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        action={handleFormAction}
        className={cn("grid items-start gap-4", className)}
      >
        <input type="hidden" id="id" name="id" defaultValue={attr?.id} />
        <input
          type="hidden"
          id="trackId"
          name="trackId"
          defaultValue={trackId || attr?.trackId}
        />

        <div className="grid gap-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <AttributeTitleCombobox
              value={title}
              onValueChange={setTitle}
              placeholder="Select existing or create new attribute..."
              className="w-full"
            />
            <input type="hidden" name="title" value={title} />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="space-y-2">
            <Label htmlFor="valueType">Value Type</Label>
            <Select
              defaultValue={valueType}
              onValueChange={(value: TrackAttributeValueType) =>
                setValueType(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select value type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRING">Text</SelectItem>
                <SelectItem value="INT">Integer</SelectItem>
                <SelectItem value="FLOAT">Decimal</SelectItem>
                <SelectItem value="DATETIME">Date & Time</SelectItem>
                <SelectItem value="DURATION">Duration</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="valueType" value={valueType} />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="space-y-2">
            <Label htmlFor="value">
              Value
              {valueType === "INT" && " (whole number)"}
              {valueType === "FLOAT" && " (decimal number)"}
              {valueType === "DATETIME" && " (date and time)"}
              {valueType === "DURATION" && " (hours:minutes)"}
              {valueType === "STRING" && " (text)"}
            </Label>
            <Input
              type={getInputType()}
              id="value"
              name="value"
              required
              defaultValue={getCurrentValue()}
              placeholder={
                valueType === "STRING"
                  ? "Enter text value"
                  : valueType === "INT"
                    ? "Enter whole number"
                    : valueType === "FLOAT"
                      ? "Enter decimal number"
                      : valueType === "DURATION"
                        ? "HH:MM (e.g., 02:30)"
                        : "Select date and time"
              }
              {...getInputProps()}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-row-reverse">
          <SubmitButton disabled={!title.trim()} />
        </div>
      </form>
    </div>
  );
};

export default TrackAttributeForm;
