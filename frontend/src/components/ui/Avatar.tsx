"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials, getColorFromString } from "@/lib/helpers";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
};

/**
 * Avatar with image fallback to colored initials.
 */
export function Avatar({ src, name, size = "md", className }: AvatarProps){
  const [error, setError] = useState(false);
  if(src && !error){
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn("rounded-full object-cover", SIZE_MAP[size], className)}
        onError={() => setError(true)}
      />
    );
  }

  const bgClass = getColorFromString(name);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white",
        SIZE_MAP[size],
        bgClass,
        className
      )}
      aria-label={`Avatar for ${name}`}
    >
      {getInitials(name)}
    </div>
  );
}
