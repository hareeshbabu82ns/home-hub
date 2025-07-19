"use client";

import { TrackAttributes } from "@/app/generated/prisma";
import React from "react";
import { LucideSave as SaveIcon, Loader2 } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { createTrackItemAttribute, updateTrackItemAttribute } from "../actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrackAttrFormProps {
  attr: TrackAttributes;
  className: string;
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

const TrackAttributeForm = ({ attr, className }: TrackAttrFormProps) => {
  const [state, formAction] = useFormState(
    attr?.id === "new" ? createTrackItemAttribute : updateTrackItemAttribute,
    initialState,
  );

  return (
    <div className="flex flex-col gap-2">
      <form
        action={formAction}
        // className="flex flex-col gap-4"
        className={cn("grid items-start gap-4", className)}
      >
        <div className="grid gap-2">
          <input
            type="hidden"
            id="id"
            name="id"
            required
            defaultValue={attr?.id}
          />
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={attr?.title}
              placeholder="Title"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              type="text"
              id="value"
              name="value"
              required
              defaultValue={attr?.value || ""}
              placeholder="Value"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-row-reverse">
          <SubmitButton />
        </div>
        <p aria-live="polite" className="sr-only" role="status">
          {state?.message}
        </p>
      </form>
      <pre>{JSON.stringify(attr, null, 2)}</pre>
    </div>
  );
};

export default TrackAttributeForm;
