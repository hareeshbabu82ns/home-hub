"use client";

import { Download, Share, SquarePlus } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useInstallPWA } from "@/hooks/use-install-pwa";

/**
 * "Install app" in the user menu: the browser's install prompt where there
 * is one (Chrome, Edge, Android), Add to Home Screen steps on iPhone/iPad.
 * Hidden once running as an installed app.
 */
export function InstallAppMenuItem() {
  const { isInstallable, isInstalled, isIos, install } = useInstallPWA();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isInstalled || (!isInstallable && !isIos)) return null;

  return (
    <>
      <DropdownMenuItem
        className="flex items-center gap-2"
        onSelect={() => (isInstallable ? void install() : setShowIosHelp(true))}
      >
        <Download className="h-4 w-4" />
        Install app
      </DropdownMenuItem>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Home Hub to your Home Screen</DialogTitle>
            <DialogDescription>
              It opens full screen, like an app, and keeps you signed in.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Share className="text-primary size-5 shrink-0" />
              <span>
                Tap <strong>Share</strong> in Safari&apos;s toolbar.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <SquarePlus className="text-primary size-5 shrink-0" />
              <span>
                Choose <strong>Add to Home Screen</strong>, then{" "}
                <strong>Add</strong>.
              </span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
