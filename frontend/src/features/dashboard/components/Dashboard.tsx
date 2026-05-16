"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Target, PieChart, TrendingUp, ArrowUpRight, 
  ArrowDownRight, ChevronRight, Activity, CreditCard
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Assuming dummy data is located in src/utils or kept as is
import { 
  dashboardAccounts, recentTransactions, dashboardGoals, dashboardBudgets 
} from "@/dummy-data/src/data/dashboard";
import { investmentSummary } from "@/dummy-data/src/data/investments";
import { expenseTransactions } from "@/dummy-data/src/data/expenses";
import { incomeTransactions } from "@/dummy-data/src/data/transactions";
import { cn } from "@/lib/utils";
import { DashboardOverview } from "./DashboardOverview";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export function Dashboard() {
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

      {/* Replaced top section with FSD component */}
      <DashboardOverview />

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
    </div>
  );
}
