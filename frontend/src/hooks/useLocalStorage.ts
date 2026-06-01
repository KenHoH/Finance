"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Sync state with localStorage.
 * Returns [value, setValue, removeValue].
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const read = useCallback((): T => {
    if(typeof window === "undefined") return initialValue;
    try{
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch{
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    try{
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch{
      // ignore
    }
  }, [key, value]);

  const remove = useCallback(() => {
    try{
      window.localStorage.removeItem(key);
    } catch{
      // ignore
    }
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, remove];
}
