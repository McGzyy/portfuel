"use client";

import { useEffect } from "react";

/** Register the watchlist push service worker on supported browsers. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* unsupported or blocked */
    });
  }, []);

  return null;
}
