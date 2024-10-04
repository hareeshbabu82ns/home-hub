"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

interface CompProps {
  className?: string;
}

const Loader = ( { className }: CompProps ) => {
  return (
    <div
      className={cn(
        "flex size-full flex-1 items-center justify-center",
        className,
      )}
    >
      <LoaderCircle className="text-primary size-8 animate-spin" />
    </div>
  );
};

export default Loader;
