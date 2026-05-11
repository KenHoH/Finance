"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PieChart, Plus, Edit2, AlertTriangle, CheckCircle2, AlertCircle, Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { budgetsData } from "@/dummy-data/src/data/budgets";
import { cn } from "@/lib/utils";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function BudgetsPage() {
  const totalBudgeted = budgetsData.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = budgetsData.reduce((acc, curr) => acc + curr.spent, 0);
  const overallRemaining = totalBudgeted - totalSpent;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <PieChart className="w-7 h-7 text-amber-500" />
            </div>
            Monthly Budgets
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Control your spending limits per category</p>
        </div>

        <button className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Create Budget
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase mb-1">Total Budgeted</p>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(totalBudgeted).replace(',00', '')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase mb-1">Total Spent</p>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(totalSpent).replace(',00', '')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase mb-1">Overall Remaining</p>
          <p className={cn("text-3xl font-extrabold", overallRemaining >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {overallRemaining < 0 ? "-" : ""}{formatCurrency(Math.abs(overallRemaining)).replace(',00', '')}
          </p>
        </motion.div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetsData.map((budget, idx) => {
          const percentage = Math.round((budget.spent / budget.limit) * 100);
          const remaining = budget.limit - budget.spent;
          
          let status = 'safe';
          let statusColor = 'bg-emerald-500';
          let statusText = 'text-emerald-500';
          let statusIcon = <CheckCircle2 className="w-4 h-4" />;
          
          if (percentage >= 100) {
            status = 'over';
            statusColor = 'bg-rose-500';
            statusText = 'text-rose-500';
            statusIcon = <AlertCircle className="w-4 h-4" />;
          } else if (percentage >= 80) {
            status = 'warning';
            statusColor = 'bg-amber-500';
            statusText = 'text-amber-500';
            statusIcon = <AlertTriangle className="w-4 h-4" />;
          }

          return (
            <motion.div key={budget.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between relative group overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-border">{budget.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{budget.category}</h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {format(parseISO(budget.startDate), 'dd MMM')} - {format(parseISO(budget.endDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className={cn("text-2xl font-extrabold tracking-tight", statusText)}>{formatCurrency(budget.spent).replace(',00', '')}</span>
                  <span className="text-sm font-semibold text-muted-foreground">of {formatCurrency(budget.limit).replace(',00', '')}</span>
                </div>
                <div className="h-3 w-full bg-border rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full transition-all", statusColor)} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className={cn("flex items-center gap-1", statusText)}>
                    {statusIcon} {percentage}% Used
                  </span>
                  <span className="text-muted-foreground">
                    {remaining >= 0 ? `${formatCurrency(remaining).replace(',00', '')} left` : `${formatCurrency(Math.abs(remaining)).replace(',00', '')} over`}
                  </span>
                </div>
              </div>

              <button className="w-full py-2.5 bg-accent hover:bg-muted text-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Eye className="w-4 h-4" /> View Transactions
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
