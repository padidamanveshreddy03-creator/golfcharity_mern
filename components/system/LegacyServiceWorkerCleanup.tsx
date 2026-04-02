"use client";

import { useEffect } from "react";

export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unregisterServiceWorkers = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );
      } catch {
        // Ignore cleanup errors in browsers/environments with restricted SW access.
      }
    };

    const clearCaches = async () => {
      if (!("caches" in window)) return;

      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // Ignore cache cleanup errors to avoid breaking page rendering.
      }
    };

    void unregisterServiceWorkers();
    void clearCaches();
  }, []);

  return null;
}
