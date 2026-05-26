"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, CheckCircle2, AlertCircle, ArrowDownLeft, ArrowUpRight, Clock, ChevronRight, X
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { billsData } from "@/dummy-data/src/data/bills";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function SplitBillsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'i_owe' | 'they_owe'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [selectedBillDetail, setSelectedBillDetail] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
    }, 2000);
  };

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24 relative">
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

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Split Bill
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border p-6">
          <div className="flex items-center gap-2 text-rose-500 font-semibold uppercase text-sm mb-2"><ArrowDownLeft className="w-4 h-4" /> You Owe</div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(amountIOwe)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border p-6">
          <div className="flex items-center gap-2 text-emerald-500 font-semibold uppercase text-sm mb-2"><ArrowUpRight className="w-4 h-4" /> You Are Owed</div>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(amountTheyOweMe)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border p-6">
          <div className="flex items-center gap-2 text-muted-foreground font-semibold uppercase text-sm mb-2">Net Balance</div>
          <p className={cn("text-3xl font-extrabold", netBalance >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1.5 w-fit shadow-sm bg-card border border-border">
        {(['all', 'i_owe', 'they_owe'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab ? "bg-indigo-500 text-white shadow-md" : "text-muted-foreground hover:bg-accent/50"
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
              onClick={() => { setSelectedBillDetail(bill); setIsDetailModalOpen(true); }}
              className="group rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
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
                  <span>Total: {formatCurrency(bill.totalAmount)}</span>
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
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-card z-10 overflow-hidden bg-accent",
                        p.status === 'paid' ? "ring-2 ring-emerald-500" : ""
                      )}
                      title={`${p.name}: ${p.status}`}
                    >
                      <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.name}&backgroundColor=${p.status === 'paid' ? 'bbf7d0' : 'f1f5f9'}`} 
                        alt={p.name} 
                        className="w-full h-full object-cover" 
                      />
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

      {/* New Split Bill Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="New Split Bill" 
        description="Split expenses easily with friends."
        isSuccess={isSuccess}
        successMessage="Split bill has been created."
      >
        <form className="space-y-4" onSubmit={handleCreateBill}>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Description</label>
            <input type="text" placeholder="e.g. Dinner at Mcdonalds" required className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Total Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <input type="number" placeholder="0" required className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Split With</label>
            <input type="text" placeholder="Add friends by name or email" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md shadow-primary/20"
          >
            Create Split Bill
          </button>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Bill Details" 
      >
        {selectedBillDetail && (
          <div className="space-y-6">
            <div className="bg-accent/50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedBillDetail.description}</h3>
                <p className="text-sm text-muted-foreground font-medium">{format(parseISO(selectedBillDetail.date), 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-medium uppercase mb-1">Total</p>
                <p className="text-2xl font-extrabold text-primary">{formatCurrency(selectedBillDetail.totalAmount)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-muted-foreground uppercase mb-3 px-2">Participants</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {selectedBillDetail.participants.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-accent shrink-0">
                        <img 
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.name}`} 
                          alt={p.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{p.name}</p>
                        <p className="text-xs font-semibold text-muted-foreground capitalize">
                          {p.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">{formatCurrency(p.amount)}</p>
                      {p.status === 'paid' ? (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end mt-1"><CheckCircle2 className="w-3 h-3" /> Settled</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1 justify-end mt-1"><Clock className="w-3 h-3" /> Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full bg-accent hover:bg-accent/80 text-foreground py-3.5 rounded-xl font-bold transition-colors active:scale-[0.98] mt-4"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
