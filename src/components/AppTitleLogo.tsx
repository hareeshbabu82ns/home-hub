import MountainIcon from "@/components/MountainIcon";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";

const AppTitleLogo = ({ className }: { className?: ClassValue }) => {
  return (
    <div className={cn("flex h-14 flex-1 items-center space-x-2 ", className)}>
      <MountainIcon className="text-tertiary-700 dark:text-tertiary-300 size-6 md:size-8" />
      <h1 className="text-secondary-700 dark:text-secondary-300 text-xl font-bold md:text-2xl">
        Hub
      </h1>
    </div>
  );
};

export default AppTitleLogo;
