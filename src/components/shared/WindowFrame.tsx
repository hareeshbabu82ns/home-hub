import { cn } from "@/lib/utils";
import React from "react";

interface WindowFrameProps {
  title: React.ReactNode | string;
  children: React.ReactNode;
  className?: string;
  classNameNavbar?: string;
}
const WindowFrame = ( {
  title,
  children,
  className,
  classNameNavbar,
}: WindowFrameProps ) => {
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
          "relative flex flex-row border-b border-gray-300 bg-gray-200/80 px-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-700/80 dark:shadow-none",
          classNameNavbar,
        )}
      >
        <div className="my-2.5 ml-20 rounded-md bg-gray-400/40 px-5 py-1 text-xs text-slate-600 sm:mx-auto md:px-10 dark:bg-zinc-500/40 dark:text-slate-300">
          {title}
        </div>
        <div className="absolute left-4 top-3.5 flex flex-row forced-color-adjust-none">
          <div className="mr-2 size-3 rounded-full border border-black/5 bg-red-500"></div>
          <div className="mr-2 size-3 rounded-full border border-black/5 bg-yellow-500"></div>
          <div className="size-3 rounded-full border border-black/5 bg-green-500"></div>
        </div>
      </div>

      {/* Contents */}
      <div className="bg-muted/30">{children}</div>
    </div>
  );
};

export default WindowFrame;
