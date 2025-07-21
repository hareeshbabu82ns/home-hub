import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UseInstallPWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

export function useInstallPWA(): UseInstallPWAReturn {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return;
      }

      // Check for navigator.standalone (iOS Safari)
      if ((navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Check for web app manifest display mode
      if (document.referrer.includes("android-app://")) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!installPrompt) {
      return;
    }

    try {
      // Show the installation prompt
      await installPrompt.prompt();

      // Wait for the user to respond to the prompt
      const result = await installPrompt.userChoice;

      if (result.outcome === "accepted") {
        console.log("User accepted the PWA installation");
      } else {
        console.log("User dismissed the PWA installation");
      }

      // Clear the prompt as it can only be used once
      setInstallPrompt(null);
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    install,
  };
}
