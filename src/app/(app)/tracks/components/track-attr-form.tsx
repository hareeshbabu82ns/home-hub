"use client";

import type {
  TrackAttributes,
  TrackAttributeValueType,
} from "@/app/generated/prisma";
import React, { useState } from "react";
import { LucideSave as SaveIcon, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTrackItemAttribute, updateTrackItemAttribute } from "../actions";
import { cn } from "@/lib/utils";
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
}

const initialState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" type="submit" disabled={pending} className="w-fit">
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
}: TrackAttrFormProps) => {
  const [state, formAction] = useActionState(
    attr?.id === "new" ? createTrackItemAttribute : updateTrackItemAttribute,
    initialState,
  );

  const [valueType, setValueType] = useState<TrackAttributeValueType>(
    attr?.valueType || "STRING",
  );

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
      default:
        return {};
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        action={formAction}
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
            <Input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={attr?.title}
              placeholder="Attribute name (e.g., Weight, Steps, Mood)"
            />
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
                      : "Select date and time"
              }
              {...getInputProps()}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-row-reverse">
          <SubmitButton />
        </div>

        {state?.message && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}
      </form>
    </div>
  );
};

export default TrackAttributeForm;
