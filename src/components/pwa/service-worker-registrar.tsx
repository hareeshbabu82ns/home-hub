"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Registers /sw.js in production builds (dev keeps it off so HMR isn't served
 * stale chunks) and offers a reload when a new version is waiting.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Clean up a worker left over from a production run on this origin.
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => void reg.unregister()));
      return;
    }

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const promptUpdate = (worker: ServiceWorker) =>
      toast("A new version of Home Hub is available", {
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              onControllerChange,
            );
            worker.postMessage("SKIP_WAITING");
          },
        },
      });

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller)
          promptUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              promptUpdate(worker);
          });
        });
      })
      .catch((error) =>
        console.warn("Service worker registration failed", error),
      );
  }, []);

  return null;
}
