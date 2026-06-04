"use client";

import { useState, useCallback } from "react";

interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
}

interface UseFormReturn {
  fields: Record<string, FieldState>;
  setValue: (name: string, value: string) => void;
  setError: (name: string, error: string | null) => void;
  touch: (name: string) => void;
  reset: () => void;
  isValid: boolean;
  getValues: () => Record<string, string>;
}

/**
 * Lightweight form state manager.
 * For Zod integration, see useZodForm (planned).
 */
export function useForm(initial: Record<string, string> = {}): UseFormReturn {
  const [fields, setFields] = useState<Record<string, FieldState>>(() => {
    const map: Record<string, FieldState> = {};
    for(const key of Object.keys(initial)) {
      map[key] = { value: initial[key], error: null, touched: false };
    }
    return map;
  });

  const setValue = useCallback((name: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], value, error: null },
    }));
  }, []);

  const setError = useCallback((name: string, error: string | null) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], error },
    }));
  }, []);

  const touch = useCallback((name: string) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], touched: true },
    }));
  }, []);

  const reset = useCallback(() => {
    const map: Record<string, FieldState> = {};
    for(const key of Object.keys(initial)) {
      map[key] = { value: initial[key], error: null, touched: false };
    }
    setFields(map);
  }, [initial]);

  const isValid = Object.values(fields).every((f) => !f.error);

  const getValues = useCallback(() => {
    const vals: Record<string, string> = {};
    for(const key of Object.keys(fields)) {
      vals[key] = fields[key].value;
    }
    return vals;
  }, [fields]);

  return { fields, setValue, setError, touch, reset, isValid, getValues };
}
