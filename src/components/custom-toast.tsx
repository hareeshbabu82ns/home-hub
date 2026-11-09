import { cva } from "class-variance-authority";

export const toastVariants = cva(
  "group pointer-events-auto flex w-full items-center gap-2 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success:
          "success group border-success bg-success text-success-foreground",
        warning:
          "warning group border-warning bg-warning text-warning-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
