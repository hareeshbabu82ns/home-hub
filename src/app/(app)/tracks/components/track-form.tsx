"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createTrackItem, updateTrackItem } from "@/app/(app)/tracks/actions";
import { useEffect } from "react";
import { toast } from "sonner";
import { LucideSave as SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrackItem } from "@prisma/client";

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

export function TrackForm({
  className,
  track,
}: {
  className?: string;
  track?: TrackItem;
}) {
  const [state, formAction] = useFormState(
    track?.id === "new" ? createTrackItem : updateTrackItem,
    initialState,
  );

  useEffect(() => {
    if (state?.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
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
          defaultValue={track?.id}
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
            defaultValue={track?.title}
            placeholder="Title"
          />
        </label>
      </div>
      <div className="grid gap-2">
        <label
          className="input input-bordered flex items-center gap-2"
          htmlFor="description"
        >
          Description
          <input
            className="grow"
            type="text"
            id="description"
            name="description"
            defaultValue={track?.description || ""}
            placeholder="Description"
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
  );
}
