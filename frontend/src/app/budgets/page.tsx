"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart, Plus, Edit2, AlertTriangle, CheckCircle2, AlertCircle, Eye, icons
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { budgetsData } from "@/dummy-data/src/data/budgets";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Dummy transactions specific to a budget
const generateDummyTransactions = (budgetId: string, category: string) => {
  const count = Math.floor(Math.random() * 5) + 3; // 3 to 7 transactions
  return Array.from({ length: count }).map((_, i) => ({
    id: `tx-${budgetId}-${i}`,
    title: `${category} Expense ${i + 1}`,
    date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
    amount: Math.floor(Math.random() * 300000) + 50000,
    merchant: ["Starbucks", "Grab", "Tokopedia", "Indomaret", "Steam", "Netflix"][Math.floor(Math.random() * 6)]
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export default function BudgetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<{ id: string, category: string } | null>(null);

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
    }, 2000);
  };

  const totalBudgeted = budgetsData.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = budgetsData.reduce((acc, curr) => acc + curr.spent, 0);
  const overallRemaining = totalBudgeted - totalSpent;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3 drop-shadow-sm">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
              <PieChart className="w-8 h-8 text-amber-500" />
            </div>
            Monthly Budgets
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Control your spending limits per category</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-amber-500/20 btn-ripple transition-all active:scale-95 hover:bg-amber-600"
        >
          <Plus className="w-5 h-5" /> Create Budget
        </button>
      </header>

      {/* Create Budget Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Budget" 
        description="Set a spending limit for a specific category."
        isSuccess={isSuccess}
        successMessage="Budget successfully created!"
      >
        <form className="space-y-4" onSubmit={handleCreateBudget}>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Category Name</label>
            <input type="text" placeholder="e.g. Groceries, Entertainment" required className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <input type="number" placeholder="0" required className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md btn-ripple"
          >
            Save Budget
          </button>
        </form>
      </Modal>

      {/* Transactions Modal */}
      <Modal 
        isOpen={!!selectedBudget} 
        onClose={() => setSelectedBudget(null)} 
        title={`${selectedBudget?.category} Transactions`}
        description="Recent expenses under this category limit."
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {selectedBudget && generateDummyTransactions(selectedBudget.id, selectedBudget.category).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-accent/50 border border-border/50 hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-lg shadow-sm border border-border">
                  💸
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{tx.title}</p>
                  <p className="text-xs font-medium text-muted-foreground">{tx.merchant} • {format(parseISO(tx.date), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-rose-500">-{formatCurrency(tx.amount).replace(',00', '')}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border glass-panel hover-pop p-8">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Budgeted</p>
          <p className="text-4xl font-extrabold text-foreground">{formatCurrency(totalBudgeted).replace(',00', '')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border glass-panel hover-pop p-8">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Spent</p>
          <p className="text-4xl font-extrabold text-foreground">{formatCurrency(totalSpent).replace(',00', '')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border glass-panel hover-pop p-8">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Overall Remaining</p>
          <p className={cn("text-4xl font-extrabold drop-shadow-sm", overallRemaining >= 0 ? "text-emerald-500" : "text-rose-500")}>
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
          let statusColor = 'bg-emerald-500 shadow-emerald-500/50';
          let statusText = 'text-emerald-500';
          let statusIcon = <CheckCircle2 className="w-5 h-5" />;
          
          if (percentage >= 100) {
            status = 'over';
            statusColor = 'bg-rose-500 shadow-rose-500/50';
            statusText = 'text-rose-500';
            statusIcon = <AlertCircle className="w-5 h-5" />;
          } else if (percentage >= 80) {
            status = 'warning';
            statusColor = 'bg-amber-500 shadow-amber-500/50';
            statusText = 'text-amber-500';
            statusIcon = <AlertTriangle className="w-5 h-5" />;
          }

          const IconComponent = icons[budget.icon as keyof typeof icons] || PieChart;

          return (
            <motion.div key={budget.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="rounded-[2rem] border border-border glass-panel hover-pop p-6 flex flex-col justify-between relative group overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-primary shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground">{budget.category}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                      {format(parseISO(budget.startDate), 'dd MMM')} - {format(parseISO(budget.endDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 text-muted-foreground hover:bg-background rounded-xl transition-colors shadow-sm border border-transparent hover:border-border"><Edit2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <span className={cn("text-3xl font-black tracking-tight", statusText)}>{formatCurrency(budget.spent).replace(',00', '')}</span>
                  <span className="text-sm font-bold text-muted-foreground">of {formatCurrency(budget.limit).replace(',00', '')}</span>
                </div>
                <div className="h-4 w-full bg-background border border-border/50 rounded-full overflow-hidden mb-3 shadow-inner p-0.5">
                  <div className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", statusColor)} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold">
                  <span className={cn("flex items-center gap-1.5", statusText)}>
                    {statusIcon} {percentage}% Used
                  </span>
                  <span className="text-muted-foreground bg-background px-3 py-1 rounded-full border border-border shadow-sm">
                    {remaining >= 0 ? `${formatCurrency(remaining).replace(',00', '')} left` : `${formatCurrency(Math.abs(remaining)).replace(',00', '')} over`}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedBudget({ id: budget.id, category: budget.category })}
                className="w-full py-3.5 bg-background hover:bg-accent border border-border text-foreground font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-md btn-ripple"
              >
                <Eye className="w-5 h-5" /> View Transactions
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
