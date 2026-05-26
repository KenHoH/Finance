"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Plus, 
  PieChart, 
  Search,
  LayoutGrid,
  List
} from "lucide-react";
import { investments, investmentSummary } from "@/dummy-data/src/data/investments";
import { InvestmentCard } from "@/components/common/InvestmentCard";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function InvestmentsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
    }, 2000);
  };

  const filteredInvestments = investments.filter((inv) =>
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            Investments
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Track and manage your investment portfolio
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Investment
        </button>
      </header>

      {/* Add Investment Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Investment" 
        description="Track a new asset in your portfolio."
        isSuccess={isSuccess}
        successMessage="Investment successfully added!"
      >
        <form className="space-y-4" onSubmit={handleCreateInvestment}>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Asset Name</label>
            <input type="text" placeholder="e.g. Apple Inc, Bitcoin" required className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Ticker Symbol</label>
            <input type="text" placeholder="e.g. AAPL, BTC" required className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium uppercase" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Initial Amount Invested</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <input type="number" placeholder="0" required className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium" />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md"
          >
            Save Investment
          </button>
        </form>
      </Modal>

      {/* Portfolio Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl border border-border p-8 shadow-sm flex flex-col justify-center group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
            <PieChart className="w-48 h-48 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-muted-foreground font-semibold mb-2 uppercase tracking-wide text-sm">
              Total Portfolio Value
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-card-foreground tracking-tight mb-6">
              {formatCurrency(investmentSummary.totalValue)}
            </h2>
            
            <div className="flex flex-wrap items-center gap-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Invested
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(investmentSummary.totalInvested)}
                </p>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Return
                </p>
                <p
                  className={cn(
                    "text-xl font-bold flex items-center gap-1",
                    investmentSummary.totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {investmentSummary.totalGainLoss >= 0 ? "+" : ""}
                  {formatCurrency(investmentSummary.totalGainLoss)} 
                  <span className="text-sm font-semibold opacity-80">
                    ({investmentSummary.totalGainLossPercent}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats or Additional Info could go here, for now empty or simple card */}
        <div className="col-span-1 rounded-3xl border border-border bg-muted/30 p-6 flex flex-col justify-center">
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" /> Asset Allocation
           </h3>
           <div className="space-y-4">
              {Object.entries(
                investments.reduce((acc, curr) => {
                  acc[curr.type] = (acc[curr.type] || 0) + curr.totalValue;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, value]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1 font-medium capitalize">
                    <span>{type.replace("_", " ")}</span>
                    <span>{((value / investmentSummary.totalValue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(value / investmentSummary.totalValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
        <h3 className="text-xl font-bold text-card-foreground">My Assets</h3>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border border-border text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground w-full sm:w-64 placeholder:text-muted-foreground shadow-sm"
            />
          </div>

          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Investments Grid/List */}
      <div
        className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        )}
      >
        {filteredInvestments.map((inv, idx) => (
          <InvestmentCard 
            key={inv.id} 
            data={inv} 
            onAddTransaction={(id) => console.log("Add tx for", id)}
            onEdit={(id) => console.log("Edit", id)}
            onDelete={(id) => console.log("Delete", id)}
          />
        ))}
        {filteredInvestments.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl">
            No investments found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
