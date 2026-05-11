"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Wallet, Target, PieChart, TrendingUp, ArrowUpRight, 
  ArrowDownRight, ChevronRight, Activity, CreditCard
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { 
  dashboardAccounts, recentTransactions, dashboardGoals, dashboardBudgets 
} from "@/dummy-data/src/data/dashboard";
import { investmentSummary } from "@/dummy-data/src/data/investments";
import { expenseTransactions } from "@/dummy-data/src/data/expenses";
import { incomeTransactions } from "@/dummy-data/src/data/transactions";
import { cn } from "@/lib/utils";

// Format Utility
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function DashboardPage() {
  const totalBalance = dashboardAccounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Welcome back! Here's your financial summary.
          </p>
        </div>
      </header>

      {/* Accounts & Top Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">Total Balance</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-card-foreground tracking-tight mb-6">
              {formatCurrency(totalBalance).replace(",00", "")}
            </h2>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">Your Accounts</h3>
            <div className="flex flex-wrap gap-4">
              {dashboardAccounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 bg-background border border-border p-3 rounded-2xl w-48 shadow-sm">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: acc.color }}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(acc.balance).replace(",00", "")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Investment Summary Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="col-span-1 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Investments</p>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-2">
              {formatCurrency(investmentSummary.totalValue).replace(",00", "")}
            </h3>
            <p className="text-sm text-emerald-500 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              +{formatCurrency(investmentSummary.totalGainLoss).replace(",00", "")} ({investmentSummary.totalGainLossPercent}%)
            </p>
          </div>
          
          <Link href="/investments" className="mt-6 flex items-center justify-between p-3 rounded-xl bg-accent text-foreground hover:bg-muted transition-colors text-sm font-bold">
            View Portfolio <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incomes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><ArrowUpRight className="w-5 h-5" /></div>
              Recent Incomes
            </h3>
            <Link href="/income" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="p-0 flex-1">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-border">
                {incomeTransactions.slice(0, 3).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground text-base">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(t.date), 'dd MMM yyyy')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-500">+{formatCurrency(t.amount).replace(',00', '')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Expenses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg"><ArrowDownRight className="w-5 h-5" /></div>
              Recent Expenses
            </h3>
            <Link href="/expenses" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="p-0 flex-1">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-border">
                {expenseTransactions.slice(0, 3).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground text-base">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(t.date), 'dd MMM yyyy')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-500">-{formatCurrency(t.amount).replace(',00', '')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Active Goals
            </h3>
            <Link href="/goals" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
            {dashboardGoals.map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="font-bold text-foreground">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(goal.current).replace(',00', '')} / {formatCurrency(goal.target).replace(',00', '')}</p>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{goal.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Budgets Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PieChart className="w-6 h-6 text-primary" />
              Budgets Overview
            </h3>
            <Link href="/budgets" className="text-sm font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
            {dashboardBudgets.map(budget => {
              const barColor = budget.status === 'safe' ? 'bg-emerald-500' : budget.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={budget.id}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="font-bold text-foreground">{budget.category}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(budget.spent).replace(',00', '')} / {formatCurrency(budget.limit).replace(',00', '')}</p>
                    </div>
                    <span className={cn("text-sm font-extrabold", budget.status === 'safe' ? "text-emerald-500" : budget.status === 'warning' ? "text-amber-500" : "text-rose-500")}>
                      {budget.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(budget.percentage, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
