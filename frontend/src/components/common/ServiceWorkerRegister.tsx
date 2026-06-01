"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker.
 */
export function ServiceWorkerRegister(){
  useEffect(() => {
    if(typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
