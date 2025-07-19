import { cn } from "@/lib/utils";
import React from "react";

interface WindowFrameProps {
  title: React.ReactNode | string;
  children: React.ReactNode;
  className?: string;
  classNameNavbar?: string;
}
const WindowFrame = ({
  title,
  children,
  className,
  classNameNavbar,
}: WindowFrameProps) => {
  return (
    <div
      className={cn(
        "flex w-full translate-y-0 flex-col overflow-hidden rounded-lg border border-solid border-black/10 bg-clip-content text-black opacity-100 shadow-xl transition delay-100 duration-700 ease-out dark:border-white/20 dark:text-white",
        className,
      )}
    >
      {/* Navbar */}
      <div
        id="navbar"
        className={cn(
          "border-border bg-card/80 relative flex flex-row border-b px-3 shadow-sm backdrop-blur-md",
          classNameNavbar,
        )}
      >
        <div className="bg-muted/40 text-muted-foreground my-2.5 ml-20 rounded-md px-5 py-1 text-xs sm:mx-auto md:px-10">
          {title}
        </div>
        <div className="absolute top-3.5 left-4 flex flex-row forced-color-adjust-none">
          <div className="border-border bg-destructive mr-2 size-3 rounded-full border"></div>
          <div className="border-border bg-warning mr-2 size-3 rounded-full border"></div>
          <div className="border-border bg-success size-3 rounded-full border"></div>
        </div>
      </div>

      {/* Contents */}
      <div className="bg-muted/30">{children}</div>
    </div>
  );
};

export default WindowFrame;
