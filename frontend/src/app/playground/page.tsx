"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Sparkles, Loader2, CheckCircle2, XCircle, Inbox, 
  AlertTriangle, RefreshCw, Plus, Tag, Calendar, 
  DollarSign, HelpCircle, Info, ArrowUpRight, Check, Trash2
} from "lucide-react";

// Types
interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: "synced" | "syncing" | "failed";
}

export default function PlaygroundPage() {
  // --- Task 1: 4 States Switcher ---
  const [activeState, setActiveState] = useState<"loading" | "success" | "error" | "empty">("loading");
  
  // --- Task 2: Optimistic Rendering Simulator ---
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", description: "Monthly Gaji", category: "Income", amount: 15000000, date: "2025-05-11", status: "synced" },
    { id: "2", description: "Coffee & Pastry", category: "Food", amount: 85000, date: "2025-05-10", status: "synced" },
  ]);
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [simulateError, setSimulateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger confetti for success
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#06b6d4", "#3b82f6", "#10b981"]
    });
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newAmount = parseFloat(amount);
    const tempId = `temp-${Date.now()}`;
    const newTx: Transaction = {
      id: tempId,
      description: desc,
      category,
      amount: newAmount,
      date: new Date().toISOString().split("T")[0],
      status: "syncing"
    };

    // 1. Optimistic Update: instantly add to state
    setTransactions((prev) => [newTx, ...prev]);
    setDesc("");
    setAmount("");

    // 2. Simulated Async Network Call
    setTimeout(() => {
      if (simulateError) {
        // Rollback / Mark failed
        setTransactions((prev) => 
          prev.map((tx) => tx.id === tempId ? { ...tx, status: "failed" } : tx)
        );
      } else {
        // Confirm Success
        setTransactions((prev) => 
          prev.map((tx) => tx.id === tempId ? { ...tx, status: "synced" } : tx)
        );
        triggerConfetti();
      }
    }, 2000);
  };

  const handleRetry = (id: string) => {
    setTransactions((prev) => 
      prev.map((tx) => tx.id === id ? { ...tx, status: "syncing" } : tx)
    );

    setTimeout(() => {
      if (simulateError) {
        setTransactions((prev) => 
          prev.map((tx) => tx.id === id ? { ...tx, status: "failed" } : tx)
        );
      } else {
        setTransactions((prev) => 
          prev.map((tx) => tx.id === id ? { ...tx, status: "synced" } : tx)
        );
        triggerConfetti();
      }
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24 text-foreground">
      {/* Introduction Hero Section */}
      <section className="relative glass-panel rounded-[2rem] p-8 md:p-12 overflow-hidden border border-border shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-40 h-40 text-primary animate-pulse" />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
            <Sparkles className="w-3 h-3 animate-spin" /> Interactive Experience
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
            UI State & Optimistic Rendering Playground
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Welcome to the interactive preview space! Test the premium dark dashboard states, explore responsive optimistic rendering models, hover over tooltips, and enjoy polished micro-interactions.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========================================================= */}
        {/* TASK 1: THE 4 STATES SHOWCASE */}
        {/* ========================================================= */}
        <section className="glass-panel rounded-3xl border border-border p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="space-y-4 mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" /> State Switcher (4 States)
            </h3>
            <p className="text-sm text-muted-foreground">
              Toggle the states below to preview high-fidelity system feedback designed to keep users engaged and informed.
            </p>
            
            {/* Switcher Buttons */}
            <div className="grid grid-cols-4 gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border/50">
              {(["loading", "success", "error", "empty"] as const).map((state) => (
                <button
                  key={state}
                  onClick={() => setActiveState(state)}
                  className={`py-2 px-1 text-xs md:text-sm font-bold rounded-xl transition-all capitalize cursor-pointer ${
                    activeState === state
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* State Showcase Display */}
          <div className="relative border border-border/40 bg-background/50 rounded-2xl p-6 min-h-[300px] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {activeState === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm font-bold text-muted-foreground animate-pulse">Syncing transactions...</span>
                  </div>
                  <div className="space-y-3">
                    {/* Skeleton elements with premium shimmer */}
                    <div className="h-16 bg-muted/40 rounded-2xl animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                    <div className="h-16 bg-muted/30 rounded-2xl animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeState === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="text-center space-y-4 flex flex-col items-center"
                >
                  <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h4 className="text-xl font-bold">Transaction Settled Successfully</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Your balance and ledger are automatically reconciled. Next automatic sync scheduled in 24 hours.
                  </p>
                  <button
                    onClick={triggerConfetti}
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs cursor-pointer"
                  >
                    Celebrate Success 🎉
                  </button>
                </motion.div>
              )}

              {activeState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="text-center space-y-4 flex flex-col items-center"
                >
                  <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500">
                    <XCircle className="w-12 h-12 animate-pulse" />
                  </div>
                  <h4 className="text-xl font-bold">Synchronisation Interrupted</h4>
                  <div className="bg-rose-500/5 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs text-rose-400 font-mono">
                    API_GATEWAY_TIMEOUT (Code: 504)
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Could not establish a secure connection to your banking service. Please check your connection.
                  </p>
                  <button
                    onClick={() => {
                      setActiveState("loading");
                      setTimeout(() => setActiveState("error"), 1500);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry Connection
                  </button>
                </motion.div>
              )}

              {activeState === "empty" && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-4 flex flex-col items-center"
                >
                  <div className="p-4 bg-secondary/50 rounded-full border border-border text-muted-foreground animate-pulse">
                    <Inbox className="w-12 h-12" />
                  </div>
                  <h4 className="text-xl font-bold">No Active Budgets Placed</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    You haven't customized any expense restrictions for this month. Start budgeting to hit your targets!
                  </p>
                  <button
                    onClick={() => {
                      setActiveState("loading");
                      setTimeout(() => setActiveState("success"), 2000);
                    }}
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs cursor-pointer"
                  >
                    Create Custom Budget
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TASK 2: OPTIMISTIC RENDERING SIMULATOR */}
        {/* ========================================================= */}
        <section className="glass-panel rounded-3xl border border-border p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="space-y-4 mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500" /> Optimistic Actions Panel
            </h3>
            <p className="text-sm text-muted-foreground">
              Submit transactions below. Notice they instantly render in the table list before resolving. Toggle simulated errors to view instant rollbacks!
            </p>
          </div>

          <div className="space-y-6">
            {/* Form */}
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-secondary/20 p-4 rounded-2xl border border-border/50">
              <div className="space-y-1.5 sm:col-span-2">
                <input
                  type="text"
                  placeholder="Enter transaction item (e.g. Sushi)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-xs font-semibold placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <input
                  type="number"
                  placeholder="Amount (Rp)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-xs font-semibold placeholder:text-muted-foreground"
                  required
                />
              </div>

              {/* Toggles and submit */}
              <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={simulateError}
                    onChange={(e) => setSimulateError(e.target.checked)}
                    className="rounded text-rose-500 focus:ring-rose-500/50 accent-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Force API Network Error (Rollback)
                  </span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Instantly
                </button>
              </div>
            </form>

            {/* List Table with Optimistic Animations */}
            <div className="overflow-hidden border border-border/40 bg-background/30 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-muted-foreground bg-secondary/30 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <AnimatePresence initial={false} mode="popLayout">
                    {transactions.map((tx) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`hover:bg-secondary/10 transition-colors ${
                          tx.status === "syncing" ? "bg-cyan-500/5 text-cyan-500/90" : 
                          tx.status === "failed" ? "bg-rose-500/5 text-rose-400" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold flex items-center gap-1.5">
                            {tx.description}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 font-bold text-muted-foreground uppercase">{tx.category}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{tx.date}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold">
                          Rp{tx.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {tx.status === "syncing" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-bold">
                              <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
                            </span>
                          )}
                          {tx.status === "synced" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                              <Check className="w-3.5 h-3.5" /> Settled
                            </span>
                          )}
                          {tx.status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                              <XCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.status === "failed" && (
                              <button
                                onClick={() => handleRetry(tx.id)}
                                className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-md border border-rose-500/20 active:scale-90 transition-all cursor-pointer"
                                title="Retry API Synchronization"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors active:scale-90 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* TASK 3: PREMIUM CUSTOM INTERACTIVE TOOLTIPS */}
      {/* ========================================================= */}
      <section className="glass-panel rounded-3xl border border-border p-6 md:p-8 shadow-lg relative overflow-hidden">
        <h3 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-primary" /> Premium Micro-Animation Tooltips
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Hover over the financial metric cards below to view interactive, high-fidelity custom tooltips packing extra dimensions of dynamic content.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Investment ROI */}
          <div className="group relative bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-6 transition-all duration-300 cursor-help flex flex-col justify-between h-40">
            <div>
              <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
                <span>Investment ROI</span>
                <Info className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">+24.8%</h2>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Reconciled portfolio yield (YTD)</p>

            {/* Custom Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-card border border-border p-4 rounded-2xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 flex flex-col gap-2">
              <div className="text-xs font-bold text-foreground flex items-center justify-between border-b border-border/50 pb-2">
                <span>Asset Class Breakdown</span>
                <span className="text-emerald-500">+24.8%</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-semibold text-muted-foreground">
                <div className="flex justify-between"><span>Crypto Ledger:</span><span className="text-foreground font-bold">+52.4%</span></div>
                <div className="flex justify-between"><span>Mutual Funds:</span><span className="text-foreground font-bold">+8.1%</span></div>
                <div className="flex justify-between"><span>Sovereign Bonds:</span><span className="text-foreground font-bold">+6.2%</span></div>
              </div>
            </div>
          </div>

          {/* Card 2: Debt Health Score */}
          <div className="group relative bg-card border border-border/80 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 cursor-help flex flex-col justify-between h-40">
            <div>
              <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
                <span>Debt health index</span>
                <Info className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-cyan-400 tracking-tight">Excellent</h2>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Under critical 30% threshold limit</p>

            {/* Custom Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-card border border-border p-4 rounded-2xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 flex flex-col gap-2">
              <div className="text-xs font-bold text-foreground flex items-center justify-between border-b border-border/50 pb-2">
                <span>Ratios Overview</span>
                <span className="text-cyan-400">Excellent</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-semibold text-muted-foreground">
                <div className="flex justify-between"><span>Debt-to-Income:</span><span className="text-foreground font-bold">12.5%</span></div>
                <div className="flex justify-between"><span>Interest Overheads:</span><span className="text-foreground font-bold">Low</span></div>
                <div className="flex justify-between"><span>Credit Score Index:</span><span className="text-foreground font-bold">810</span></div>
              </div>
            </div>
          </div>

          {/* Card 3: Projected Savings */}
          <div className="group relative bg-card border border-border/80 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 cursor-help flex flex-col justify-between h-40">
            <div>
              <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">
                <span>Projected Savings</span>
                <Info className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Rp12.4M</h2>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Estimated monthly margin reserves</p>

            {/* Custom Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-card border border-border p-4 rounded-2xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 flex flex-col gap-2">
              <div className="text-xs font-bold text-foreground flex items-center justify-between border-b border-border/50 pb-2">
                <span>Margin Allocation</span>
                <span className="text-indigo-400">Rp12,450,000</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-semibold text-muted-foreground">
                <div className="flex justify-between"><span>Liquid Cash Reserve:</span><span className="text-foreground font-bold">Rp5.0M</span></div>
                <div className="flex justify-between"><span>Investments Flow:</span><span className="text-foreground font-bold">Rp5.0M</span></div>
                <div className="flex justify-between"><span>Emergency Reserves:</span><span className="text-foreground font-bold">Rp2.4M</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
