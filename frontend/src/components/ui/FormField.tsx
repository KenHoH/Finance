"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { FormFieldProps } from "@/lib/types";

export function FormField({ label, htmlFor, error, children, className }: FormFieldProps){
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs font-medium text-rose-400">{error}</p>
      )}
    </div>
  );
}
