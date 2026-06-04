"use client";

import { cn } from "@/lib/utils";
import type { SkeletonProps } from "@/lib/types";

export function Skeleton({ className }: SkeletonProps){
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-lg",
        className
      )}
    />
  );
}

import type { SkeletonCardProps } from "@/lib/types";

export function SkeletonCard({ className, children }: SkeletonCardProps){
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5", className)}>
      {children}
    </div>
  );
}
