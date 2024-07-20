"use client";

import { TrackAttributes } from "@prisma/client";
import React from "react";
import { LucideSave as SaveIcon } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { createTrackItemAttribute, updateTrackItemAttribute } from "../actions";
import { cn } from "@/lib/utils";

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
    <button
      className="btn btn-secondary btn-sm"
      type="submit"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending && <span className="loading loading-spinner" />}
      <SaveIcon size={"20px"} />
      Save
    </button>
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
          <label
            className="input input-bordered flex items-center gap-2"
            htmlFor="title"
          >
            Title
            <input
              className="grow"
              type="text"
              id="title"
              name="title"
              required
              defaultValue={attr?.title}
              placeholder="Title"
            />
          </label>
        </div>
        <div className="grid gap-2">
          <label
            className="input input-bordered flex items-center gap-2"
            htmlFor="description"
          >
            Value
            <input
              className="grow"
              type="text"
              id="value"
              name="value"
              defaultValue={attr?.value || ""}
              placeholder="Value"
            />
          </label>
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
