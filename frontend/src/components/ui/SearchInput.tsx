"use client";

import React, { forwardRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Search input with debounce-ready onChange, clear button, and loading spinner.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, placeholder = "Search...", isLoading, className, autoFocus }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-sm outline-none transition-all",
            "placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          )}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : value ? (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
