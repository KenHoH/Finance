"use client";

import React, { useState, useEffect } from "react";

/**
 * Live region for screen reader announcements.
 * Components can dispatch a custom event 'a11y-announce' to trigger announcements.
 */
export function A11yAnnouncer(){
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail as string;
      setMessage(detail);
      setTimeout(() => setMessage(""), 1000);
    }
    window.addEventListener("a11y-announce", handler);
    return () => window.removeEventListener("a11y-announce", handler);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

export function announce(message: string) {
  if(typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("a11y-announce", { detail: message }));
  }
}
