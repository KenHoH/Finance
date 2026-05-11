"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, CheckCircle2, AlertCircle, ArrowDownLeft, ArrowUpRight, Clock, ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { billsData } from "@/dummy-data/src/data/bills";
import { cn } from "@/lib/utils";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function SplitBillsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'i_owe' | 'they_owe'>('all');

  // Calculations
  const amountIOwe = billsData
    .filter(b => b.type === 'i_owe_them' && b.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.participants.reduce((a, p) => a + (p.status === 'pending' ? p.amount : 0), 0), 0);
  
  const amountTheyOweMe = billsData
    .filter(b => b.type === 'they_owe_me' && b.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.participants.reduce((a, p) => a + (p.status === 'pending' ? p.amount : 0), 0), 0);

  const netBalance = amountTheyOweMe - amountIOwe;

  const filteredBills = billsData.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'i_owe') return b.type === 'i_owe_them';
    if (activeTab === 'they_owe') return b.type === 'they_owe_me';
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Users className="w-7 h-7 text-indigo-500" />
            </div>
            Split Bills
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Manage shared expenses with friends</p>
        </div>

        <button className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
          <Plus className="w-5 h-5" /> New Split Bill
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 font-semibold uppercase text-sm mb-2"><ArrowDownLeft className="w-4 h-4" /> You Owe</div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(amountIOwe).replace(',00', '')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 font-semibold uppercase text-sm mb-2"><ArrowUpRight className="w-4 h-4" /> You Are Owed</div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(amountTheyOweMe).replace(',00', '')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground font-semibold uppercase text-sm mb-2">Net Balance</div>
          <p className={cn("text-3xl font-extrabold", netBalance >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance).replace(',00', '')}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card border border-border rounded-2xl p-1.5 w-fit shadow-sm">
        {(['all', 'i_owe', 'they_owe'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab ? "bg-indigo-500 text-white shadow-md" : "text-muted-foreground hover:bg-accent"
            )}
          >
            {tab === 'all' ? "All Bills" : tab === 'i_owe' ? "I Owe Them" : "They Owe Me"}
          </button>
        ))}
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredBills.map((bill, idx) => (
            <motion.div 
              key={bill.id} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              transition={{ delay: idx * 0.05 }}
              className="group bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{bill.description}</h3>
                  {bill.status === 'SETTLED' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Settled</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                  <span>{format(parseISO(bill.date), 'dd MMM yyyy')}</span>
                  <span>•</span>
                  <span>Total: {formatCurrency(bill.totalAmount).replace(',00', '')}</span>
                  <span>•</span>
                  <span className="capitalize text-indigo-500">Created by {bill.creator}</span>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div className="flex -space-x-2">
                  {bill.participants.map((p, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-card z-10",
                        p.status === 'paid' ? "bg-emerald-500 text-white" : "bg-accent text-muted-foreground"
                      )}
                      title={`${p.name}: ${p.status}`}
                    >
                      {p.avatar}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground group-hover:text-indigo-500 transition-colors">
                  View Details <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
          {filteredBills.length === 0 && (
            <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground font-medium">
              No bills found in this category.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
