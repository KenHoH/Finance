"use client";

import { useEffect, RefObject } from "react";

/**
 * Trigger `handler` when a click occurs outside the referenced element.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void
){
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if(ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return() => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler]);
}
