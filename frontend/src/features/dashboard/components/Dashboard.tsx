"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowDownRight, ArrowRight, Plus,
  Target, Wallet,
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency, unwrapArray } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DashboardOverview } from "./DashboardOverview";
import { useAuthStore } from "@/store/useAuthStore";
import { BudgetAlerts } from "@/components/common/BudgetAlerts";
import { OnboardingTour } from "@/components/common/OnboardingTour";
import type { Transaction, Budget, Goal } from "@/lib/types";

export function Dashboard(){
  const user = useAuthStore((s) => s.user);
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions-all"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions");
      return unwrapArray<Transaction>(res);
    },
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => get<Goal[]>("/goals"),
  });

  const txArray = Array.isArray(transactions) ? transactions : [];
  const incomes = txArray
    .filter((t) => t.type === "INCOME")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const expenses = txArray
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const activeBudgets = budgets.filter((b) => {
    const now = new Date();
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    return isAfter(now, start) && isBefore(now, end);
  }).slice(0, 3);

  const activeGoals = goals.filter((g) => g.status === "IN_PROGRESS").slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 pt-4">
      <header data-tour="welcome" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back{user?.username ? `, ${user.username}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is your financial overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            data-tour="add-income"
            href="/income"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Income
          </Link>
          <Link
            data-tour="add-expense"
            href="/expenses"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </Link>
        </div>
      </header>

      <OnboardingTour />

      <BudgetAlerts />

      <div data-tour="dashboard-overview">
        <DashboardOverview />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Income */}
        <motion.div
          data-tour="recent-income"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-500/10 rounded-lg">
                <ArrowUpRight className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Recent Income</h3>
            </div>
            <Link href="/income" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg skeleton-shimmer" />)}</div>
            ) : incomes.length === 0 ? (
              <div className="p-8 text-center">
                <img src="/empty-transactions.webp" alt="" className="w-52 h-52 mx-auto mb-3 opacity-60" />
                <p className="text-sm text-muted-foreground">No income transactions yet. <Link href="/income" className="text-primary font-semibold hover:underline">Add one</Link></p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {incomes.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-sky-500/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.description || "Income"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(t.date), "dd MMM yyyy")}</p>
                    </div>
                    <span className="text-sm font-semibold text-sky-400">+{formatCurrency(Number(t.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Budgets Widget */}
        <motion.div
          data-tour="active-budgets"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Active Budgets</h3>
            </div>
            <Link href="/budgets" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 p-4">
            {budgetsLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg skeleton-shimmer" />)}</div>
            ) : activeBudgets.length === 0 ? (
              <div className="text-center py-6">
                <img src="/empty-budgets.webp" alt="" className="w-52 h-52 mx-auto mb-2 opacity-70" />
                <p className="text-sm text-muted-foreground">No active budgets. <Link href="/budgets" className="text-primary font-semibold hover:underline">Create one</Link></p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBudgets.map((b) => {
                  const spent = Number(b.amount) * 0.6; // placeholder until real spent data
                  const pct = Math.min((spent / Number(b.amount)) * 100, 100);
                  const isOver = pct >= 100;
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-foreground">{b.category?.name || "Uncategorized"}</span>
                        <span className={cn("text-xs font-bold", isOver ? "text-rose-400" : pct >= 80 ? "text-sky-400" : "text-sky-400")}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", isOver ? "bg-rose-500" : pct >= 80 ? "bg-sky-500" : "bg-sky-500")} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(spent)} of {formatCurrency(Number(b.amount))}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Expenses */}
        <motion.div
          data-tour="recent-expenses"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Recent Expenses</h3>
            </div>
            <Link href="/expenses" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg skeleton-shimmer" />)}</div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center">
                <img src="/empty-transactions.webp" alt="" className="w-52 h-52 mx-auto mb-3 opacity-60" />
                <p className="text-sm text-muted-foreground">No expense transactions yet. <Link href="/expenses" className="text-primary font-semibold hover:underline">Add one</Link></p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-sky-500/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.description || "Expense"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(t.date), "dd MMM yyyy")}</p>
                    </div>
                    <span className="text-sm font-semibold text-rose-400">-{formatCurrency(Number(t.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Goals Widget */}
        <motion.div
          data-tour="active-goals"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-500/10 rounded-lg">
                <Target className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Active Goals</h3>
            </div>
            <Link href="/goals" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 p-4">
            {goalsLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg skeleton-shimmer" />)}</div>
            ) : activeGoals.length === 0 ? (
              <div className="text-center py-6">
                <img src="/empty-goals.webp" alt="" className="w-52 h-52 mx-auto mb-2 opacity-70" />
                <p className="text-sm text-muted-foreground">No active goals. <Link href="/goals" className="text-primary font-semibold hover:underline">Create one</Link></p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((g) => {
                  const pct = g.targetAmount > 0 ? Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100) : 0;
                  return (
                    <div key={g.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-xs font-bold text-sky-400">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(Number(g.currentAmount))} of {formatCurrency(Number(g.targetAmount))}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
