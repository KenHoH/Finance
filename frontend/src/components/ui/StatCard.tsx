"use client";

import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

/**
 * Financial summary card used across dashboard, income, expenses pages.
 */
export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps){
  return (
    <div
      className={cn(
        "glass-card glow-border relative rounded-2xl p-5 transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(value)}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {trend.value}% from last period
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
