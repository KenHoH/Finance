"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./SearchInput";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  className?: string;
}

/**
 * Horizontal filter bar with search + dropdown filters.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  className,
}: FilterBarProps){
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="sm:w-64"
      />
      {filters && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <select
              key={f.label}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">{f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  );
}
