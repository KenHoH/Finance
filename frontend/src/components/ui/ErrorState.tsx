"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Consistent error state with retry button.
 */
export function ErrorState({ message = "Failed to load data.", onRetry, className }: ErrorStateProps){
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center", className)}>
      <AlertCircle className="h-8 w-8 text-rose-400" />
      <p className="text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}
