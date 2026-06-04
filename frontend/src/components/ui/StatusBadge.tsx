"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import type { Status, StatusBadgeProps } from "@/lib/types";

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, color: "text-sky-400", bg: "bg-sky-500/10" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" },
};

export function StatusBadge({ status, className }: StatusBadgeProps){
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
