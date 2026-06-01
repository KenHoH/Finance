"use client";

import React, { forwardRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CurrencyInputProps } from "@/lib/types";

function formatNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID");
}

function unformatNumber(formatted: string): string {
  return formatted.replace(/\./g, "");
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder, className, id, required, min, max }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
      setDisplayValue(formatNumberInput(value));
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = unformatNumber(e.target.value);
        onChange(raw);
      },
      [onChange]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") {
        e.preventDefault();
      }
    }, []);

    return (
      <div className={cn("relative", className)}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
          Rp
        </span>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
