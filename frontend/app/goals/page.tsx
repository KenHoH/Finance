"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Target, Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle, PlusCircle
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { goalsData } from "@/dummy-data/src/data/goals";
import { cn } from "@/lib/utils";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function GoalsPage() {
  const currentDate = new Date("2025-05-11T12:00:00Z");

  const totalGoals = goalsData.length;
  const completedGoals = goalsData.filter(g => g.status === 'completed').length;
  const activeGoals = goalsData.filter(g => g.status === 'active').length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Target className="w-7 h-7 text-blue-500" />
            </div>
            Financial Goals
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Plan and track your saving targets</p>
        </div>

        <button className="flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Add Goal
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-full"><Target className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-muted-foreground uppercase">Total Goals</p><p className="text-3xl font-bold text-foreground">{totalGoals}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full"><CheckCircle2 className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-muted-foreground uppercase">Completed</p><p className="text-3xl font-bold text-foreground">{completedGoals}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-full"><Clock className="w-8 h-8" /></div>
          <div><p className="text-sm font-medium text-muted-foreground uppercase">In Progress</p><p className="text-3xl font-bold text-foreground">{activeGoals}</p></div>
        </motion.div>
      </div>

      {/* Goal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goalsData.map((goal, idx) => {
          const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
          const deadlineDate = parseISO(goal.deadline);
          const daysLeft = differenceInDays(deadlineDate, currentDate);
          
          let statusBadge = null;
          if (goal.status === 'completed') {
            statusBadge = <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
          } else if (goal.status === 'expired') {
            statusBadge = <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500"><AlertCircle className="w-3.5 h-3.5" /> Expired</span>;
          } else {
            statusBadge = <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500"><Clock className="w-3.5 h-3.5" /> {daysLeft} days left</span>;
          }

          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{goal.name}</h3>
                  {statusBadge}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="text-3xl font-extrabold" style={{ color: goal.color }}>{formatCurrency(goal.currentAmount).replace(',00', '')}</span>
                    <span className="text-sm font-semibold text-muted-foreground mt-1">of {formatCurrency(goal.targetAmount).replace(',00', '')}</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: goal.color }}>{percentage}%</span>
                </div>
                <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: goal.color }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground font-medium">Target: <span className="text-foreground font-bold">{format(deadlineDate, 'dd MMM yyyy')}</span></p>
                {goal.status === 'active' && (
                  <button className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-xl transition-colors">
                    <PlusCircle className="w-4 h-4" /> Add Funds
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
