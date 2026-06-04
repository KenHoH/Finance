"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ProgressRingProps } from "@/lib/types";

export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 5,
  className,
  textClassName,
  showPercentage = true,
}: ProgressRingProps){
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  const getColor = () => {
    if(clampedProgress >= 80) return "#0ea5e9";
    if(clampedProgress >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showPercentage && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-bold",
            textClassName
          )}
        >
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
}
