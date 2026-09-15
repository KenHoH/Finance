"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface DebtsSummaryProps {
  totalDebt: number;
  debtCount: number;
  budgetCount: number;
}

export function DebtsSummary({ totalDebt, debtCount, budgetCount }: DebtsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-9"
      >
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Overbudget</p>
        <p className="text-3xl font-bold text-rose-400">{formatCurrency(totalDebt)}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-9"
      >
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Overspent Budgets</p>
        <p className="text-3xl font-bold text-foreground">{debtCount}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-9"
      >
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Active Budgets</p>
        <p className="text-3xl font-bold text-foreground">{budgetCount}</p>
      </motion.div>
    </div>
  );
}
