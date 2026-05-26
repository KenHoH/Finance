"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Wallet, AlertCircle, TrendingDown, PiggyBank, ArrowUpCircle, AlertTriangle
} from "lucide-react";
import { debtData, savingData } from "@/dummy-data/src/data/debts";
import { cn } from "@/lib/utils";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function DebtsAndSavingsPage() {
  const totalDebt = debtData.reduce((acc, curr) => acc + curr.debtAmount, 0);
  const debtCount = debtData.length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-12 max-w-7xl mx-auto pb-24">
      
      {/* DEBTS SECTION */}
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-7 h-7 text-rose-500" />
            </div>
            Debt Management
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Track your overspent budgets and debts</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Total Debt</p>
              <p className="text-4xl font-extrabold text-rose-500 tracking-tight">{formatCurrency(totalDebt)}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Overspent Budgets</p>
              <p className="text-4xl font-extrabold text-foreground tracking-tight">{debtCount}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debtData.map((debt, idx) => (
            <motion.div key={debt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (0.1 * idx) }} className="rounded-3xl border border-border bg-card p-6 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-foreground">{debt.budgetName}</h3>
                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 text-xs font-bold rounded-full">+{debt.overspendPercentage}% Over</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Budget</span><span className="font-semibold">{formatCurrency(debt.budgetAmount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Spent</span><span className="font-semibold">{formatCurrency(debt.totalSpent)}</span></div>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground">Debt Amount</span>
                <span className="text-xl font-extrabold text-rose-500">{formatCurrency(debt.debtAmount)}</span>
              </div>
            </motion.div>
          ))}
          {debtData.length === 0 && (
            <div className="col-span-full p-12 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground font-medium">
              You have no active debts. Great job!
            </div>
          )}
        </div>
      </section>

      {/* SAVINGS SECTION */}
      <section className="space-y-6 pt-8 border-t border-border">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <PiggyBank className="w-7 h-7 text-emerald-500" />
            </div>
            Savings Hub
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Monitor points saved from under-spent budgets</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase mb-1 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /> Total Savings</p>
              <p className="text-4xl font-extrabold text-emerald-500 tracking-tight">+{formatCurrency(savingData.totalSavings)}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase mb-1 flex items-center gap-2"><Wallet className="w-4 h-4" /> Monthly Saving Rate</p>
              <p className="text-4xl font-extrabold text-foreground tracking-tight">{savingData.monthlySavingRate}%</p>
            </div>
          </motion.div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Budgets Contributing to Savings</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {savingData.contributingBudgets.map((b, idx) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + (0.1 * idx) }} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm">
                <div>
                  <p className="font-bold text-foreground text-lg">{b.budgetName}</p>
                  <p className="text-sm text-muted-foreground">Budget: {formatCurrency(b.budgetAmount)} | Spent: {formatCurrency(b.totalSpent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-0.5">Saved</p>
                  <p className="text-xl font-extrabold text-emerald-500">+{formatCurrency(b.savedAmount)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
