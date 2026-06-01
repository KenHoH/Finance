"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts for accessibility and power users.
 */
export function KeyboardShortcuts(){
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent){
      if(e.metaKey || e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            break;
          case "t":
            e.preventDefault();
            router.push("/transactions");
            break;
          case "s":
            e.preventDefault();
            router.push("/search");
            break;
          case "n":
            e.preventDefault();
            // Could open a "new transaction" modal
            break;
        }
      }

      // Escape handling for modals is handled per-component
      if(e.key === "Tab") {
        document.body.classList.add("keyboard-navigation");
      }
    }

    function handleMouseDown() {
      document.body.classList.remove("keyboard-navigation");
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [router]);

  return null;
}
