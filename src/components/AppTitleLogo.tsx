import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";
import Image from "next/image";

const AppTitleLogo = ({ className }: { className?: ClassValue }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/icon-192.svg"
        alt="App logo"
        width={24}
        height={24}
        className="size-6 shrink-0 sm:size-7 lg:size-8"
      />
      <h1 className="text-foreground text-lg font-bold sm:text-xl lg:text-2xl">
        Hub
      </h1>
    </div>
  );
};

export default AppTitleLogo;
