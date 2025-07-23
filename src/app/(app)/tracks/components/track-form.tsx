"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createTrackItem, updateTrackItem } from "@/app/(app)/tracks/actions";
import { toast } from "sonner";
import { LucideSave as SaveIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackItem } from "@/app/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  message: "",
  success: false,
};

type FormState = {
  message: string;
  success?: boolean;
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

export function TrackForm({
  className,
  track,
}: {
  className?: string;
  track?: TrackItem;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData>(
    track?.id === "new" ? createTrackItem : updateTrackItem,
    initialState,
  );

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
        // Redirect to tracks list after successful creation
        if (track?.id === "new") {
          setTimeout(() => {
            router.push("/tracks");
          }, 1000);
        }
      } else {
        toast.error(state.message);
      }
    }
  }, [state, track?.id, router]);

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
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={track?.title}
            placeholder="Title"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={track?.description || ""}
            placeholder="Description"
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
  );
}
