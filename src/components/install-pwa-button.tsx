"use client";

import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPWA } from "@/hooks/use-install-pwa";

interface InstallPWAButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function InstallPWAButton({
  variant = "outline",
  size = "default",
  className,
}: InstallPWAButtonProps) {
  const { isInstallable, isInstalled, install } = useInstallPWA();

  if (isInstalled) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Check className="mr-2 h-4 w-4" />
        App Installed
      </Button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={install}
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
