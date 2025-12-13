"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TOPIC_COLORS,
  TOPIC_ICONS,
  type TimeTopicWithSessions,
} from "@/types/time-tracking";
import { createTimeTopic, updateTimeTopic } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getIconByName } from "@/lib/icons";

interface TopicDialogProps {
  topic?: TimeTopicWithSessions;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (_open: boolean) => void;
}

export function TopicDialog({
  topic,
  trigger,
  open,
  onOpenChange,
}: TopicDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(topic?.name ?? "");
  const [color, setColor] = useState(topic?.color ?? TOPIC_COLORS[0].value);
  const [icon, setIcon] = useState(topic?.icon ?? "Clock");

  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : isOpen;
  const setDialogOpen = isControlled && onOpenChange ? onOpenChange : setIsOpen;

  const [createState, createAction, isCreating] = useActionState(
    createTimeTopic,
    { message: "", success: false },
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updateTimeTopic,
    { message: "", success: false },
  );

  const isEdit = !!topic;
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (createState.success) {
      toast.success(createState.message);
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } else if (createState.message && !createState.success) {
      toast.error(createState.message);
    }
  }, [createState, setDialogOpen, router]);

  useEffect(() => {
    if (updateState.success) {
      toast.success(updateState.message);
      setDialogOpen(false);
      router.refresh();
    } else if (updateState.message && !updateState.success) {
      toast.error(updateState.message);
    }
  }, [updateState, setDialogOpen, router]);

  useEffect(() => {
    if (topic) {
      setName(topic.name);
      setColor(topic.color);
      setIcon(topic.icon ?? "Clock");
    }
  }, [topic]);

  const resetForm = () => {
    setName("");
    setColor(TOPIC_COLORS[0].value);
    setIcon("Clock");
  };

  const handleSubmit = (formData: FormData) => {
    // Add topic ID for edit mode
    if (isEdit && topic?.id) {
      formData.append("id", topic.id);
    }

    // Call appropriate action
    if (isEdit) {
      updateAction(formData);
    } else {
      createAction(formData);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Topic" : "New Topic"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          {/* Hidden inputs for color and icon since they're set via buttons */}
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value={icon} />

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, Study, Exercise"
              required
              maxLength={50}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "size-8 rounded-full transition-all",
                    "hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none",
                    color === c.value && "ring-2 ring-offset-2",
                  )}
                  style={{
                    backgroundColor: c.value,
                    // @ts-expect-error ringColor is valid CSS custom property workaround
                    "--tw-ring-color": c.value,
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_ICONS.map((iconName) => {
                const IconComponent = getIconByName(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border transition-all",
                      "hover:bg-muted focus:ring-2 focus:outline-none",
                      icon === iconName
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                    title={iconName}
                  >
                    <IconComponent
                      className="size-5"
                      style={{ color: icon === iconName ? color : undefined }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="flex items-center gap-3 rounded-lg border p-4"
              style={{ borderColor: `${color}40` }}
            >
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}20` }}
              >
                {(() => {
                  const PreviewIcon = getIconByName(icon);
                  return <PreviewIcon className="size-5" style={{ color }} />;
                })()}
              </div>
              <span className="font-medium">{name || "Topic Name"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Topic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Quick add button for the grid
export function AddTopicCard() {
  return (
    <TopicDialog
      trigger={
        <button className="group border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/40 flex min-h-70 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all">
          <div className="bg-muted flex size-14 items-center justify-center rounded-full transition-transform group-hover:scale-110">
            <Plus className="text-muted-foreground size-6" />
          </div>
          <p className="text-muted-foreground mt-4 font-medium">Add Topic</p>
        </button>
      }
    />
  );
}
