"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker and reloads when a new version is waiting.
 */
export function ServiceWorkerRegister(){
  useEffect(() => {
    if(typeof window !== "undefined" && "serviceWorker" in navigator){
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if(!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if(newWorker.state === "activated"){
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
