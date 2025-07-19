import MountainIcon from "@/components/MountainIcon";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";

const AppTitleLogo = ({ className }: { className?: ClassValue }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MountainIcon className="text-primary size-6 shrink-0 sm:size-7 lg:size-8" />
      <h1 className="text-foreground text-lg font-bold sm:text-xl lg:text-2xl">
        Hub
      </h1>
    </div>
  );
};

export default AppTitleLogo;
