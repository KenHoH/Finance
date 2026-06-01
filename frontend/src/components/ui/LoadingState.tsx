"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Consistent loading spinner with optional message.
 */
export function LoadingState({ message = "Loading...", className }: LoadingStateProps){
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center gap-3", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
