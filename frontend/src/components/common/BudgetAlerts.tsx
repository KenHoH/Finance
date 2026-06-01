"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { calculatePercentage } from "@/lib/helpers";
import type { Budget, Transaction } from "@/lib/types";

interface AlertItem {
  budgetId: string;
  name: string;
  spent: number;
  limit: number;
  percent: number;
  severity: "warning" | "critical";
}

/**
 * Budget alert banner that shows when spending nears or exceeds budget limits.
 */
export function BudgetAlerts(){
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get("/budgets"),
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions", "all"],
    queryFn: () => get("/transactions"),
  });

  const alerts = useMemo<AlertItem[]>(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return budgets
      .map((budget) => {
        const monthStart = budget.startDate.slice(0, 7);
        const monthEnd = budget.endDate.slice(0, 7);
        if(currentMonth < monthStart || currentMonth > monthEnd) return null;

        const txArray = Array.isArray(transactions) ? transactions : [];
        const spent = txArray
          .filter((t) =>
            t.type === "EXPENSE" &&
            t.categoryId === budget.categoryId &&
            t.date >= budget.startDate &&
            t.date <= budget.endDate
          )
          .reduce((s, t) => s + Number(t.amount), 0);

        const percent = calculatePercentage(spent, budget.amount);
        if(percent < 75) return null;

        return {
          budgetId: budget.id,
          name: budget.category?.name || "Uncategorized",
          spent,
          limit: budget.amount,
          percent,
          severity: percent >= 100 ? "critical" : "warning",
        };
      })
      .filter(Boolean) as AlertItem[];
  }, [budgets, transactions]);

  if(!alerts.length) return null;

  return (
    <AnimatePresence>
      <div className="mb-4 space-y-2">
        {alerts.map((alert) => (
          <motion.div
            key={alert.budgetId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3",
              alert.severity === "critical"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            )}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">
                {alert.name} budget {alert.severity === "critical" ? "exceeded" : "nearing limit"}
              </p>
              <p className="text-[10px] opacity-80">
                {formatCurrency(alert.spent)} of {formatCurrency(alert.limit)} ({alert.percent.toFixed(0)}%)
              </p>
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full",
                  alert.severity === "critical" ? "bg-rose-400" : "bg-amber-400"
                )}
                style={{ width: `${Math.min(alert.percent, 100)}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
