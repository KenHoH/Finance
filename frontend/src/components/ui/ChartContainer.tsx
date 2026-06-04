"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Wrapper for Recharts with loading, error, and empty states.
 */
export function ChartContainer({
  title,
  subtitle,
  children,
  isLoading,
  error,
  onRetry,
  className,
}: ChartContainerProps){
  return (
    <div className={cn("glass-card glow-border relative rounded-2xl p-5", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="relative min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs text-muted-foreground">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
