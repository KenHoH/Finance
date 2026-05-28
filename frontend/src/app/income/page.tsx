"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import {
  Calendar as CalendarIcon, Filter, Search, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpRight, DollarSign, ReceiptText, X, Image as ImageIcon,
  Repeat, CreditCard, Tag, FileText, ArrowDown, Wallet, CalendarRange, ListFilter, ArrowUpCircle
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { incomeTransactions } from "@/dummy-data/src/data/transactions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function IncomePage() {
  // Fixed current date relative to dummy data
  const currentDate = new Date("2025-05-11T12:00:00Z");

  const [timeFilter, setTimeFilter] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime'>('thisMonth');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const itemsPerPage = 6;

  // 1. Process Data
  const parsedData = useMemo(() => {
    return incomeTransactions.map(t => ({
      ...t,
      parsedDate: parseISO(t.date),
    }));
  }, []);

  const filteredData = useMemo(() => {
    let filtered = parsedData;

    if (timeFilter === 'thisMonth') {
      filtered = filtered.filter(t => isWithinInterval(t.parsedDate, { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }));
    } else if (timeFilter === 'lastMonth') {
      const lastMonth = subMonths(currentDate, 1);
      filtered = filtered.filter(t => isWithinInterval(t.parsedDate, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }));
    } else if (timeFilter === 'thisYear') {
      filtered = filtered.filter(t => isWithinInterval(t.parsedDate, { start: startOfYear(currentDate), end: endOfYear(currentDate) }));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = sortField === 'date' ? a.parsedDate.getTime() : a[sortField];
      let valB = sortField === 'date' ? b.parsedDate.getTime() : b[sortField];

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [parsedData, timeFilter, sortField, sortDir, searchQuery]);

  // 2. Compute Metrics & Chart Data
  const totalIncome = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = useMemo(() => {
    const chronological = [...filteredData].sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    const agg: Record<string, number> = {};

    chronological.forEach(t => {
      const key = timeFilter === 'thisYear' || timeFilter === 'allTime'
        ? format(t.parsedDate, 'MMM yyyy')
        : format(t.parsedDate, 'dd MMM');
      agg[key] = (agg[key] || 0) + t.amount;
    });

    return Object.entries(agg).map(([date, amount]) => ({ date, amount }));
  }, [filteredData, timeFilter]);

  // 3. Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Re-adjust page if data changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredData, currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              Income Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-base">Monitor and track your revenue streams clearly</p>
          </div>

          <div className="flex items-center gap-2 bg-card p-2 rounded-2xl border border-border shadow-sm">
            {(['thisMonth', 'lastMonth', 'thisYear', 'allTime'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
                  timeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {filter === 'thisMonth' && "This Month"}
                {filter === 'lastMonth' && "Last Month"}
                {filter === 'thisYear' && "This Year"}
                {filter === 'allTime' && "All Time"}
              </button>
            ))}
          </div>
        </header>

        {/* Overview & Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Income Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm p-8 flex flex-col justify-between group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
              <ArrowUpRight className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-semibold mb-4">
                <ArrowUpCircle className="w-5 h-5" />
                <span>Total Income</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-card-foreground tracking-tight">
                {formatCurrency(totalIncome).replace(',00', '')}
              </h2>
              <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm font-medium">
                <CalendarRange className="w-4 h-4" />
                {timeFilter === 'thisMonth' && "1 May - 31 May 2025"}
                {timeFilter === 'lastMonth' && "1 Apr - 30 Apr 2025"}
                {timeFilter === 'thisYear' && "1 Jan - 31 Dec 2025"}
                {timeFilter === 'allTime' && "Lifetime Earnings"}
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-border flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Transactions</p>
                <p className="text-xl font-bold text-card-foreground">{filteredData.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Top Category</p>
                <p className="text-lg font-bold text-card-foreground">
                  {filteredData.length > 0 ? filteredData[0].category : "-"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Chart Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-3xl border border-border bg-card shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                Income Trend
              </h3>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 500 }}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                    dx={-10}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--card-foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 600 }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden"
        >
          {/* Table Toolbar */}
          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
            <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-muted-foreground" />
              Recent Transactions
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="bg-background border border-border text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground w-full sm:w-64 placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => {
                    if (sortField === 'date') {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('date');
                      setSortDir('desc');
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1",
                    sortField === 'date' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => {
                    if (sortField === 'amount') {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('amount');
                      setSortDir('desc');
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1",
                    sortField === 'amount' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Amount {sortField === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 tracking-wider">Date</th>
                  <th className="px-6 py-4 tracking-wider">Description</th>
                  <th className="px-6 py-4 tracking-wider">Category</th>
                  <th className="px-6 py-4 tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 tracking-wider">Source</th>
                  <th className="px-6 py-4 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-base">
                        No transactions found for the selected filters.
                      </td>
                    </tr>
                  )}
                  {paginatedData.map((t, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={t.id}
                      className="hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTx(t)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shadow-sm">
                            {format(t.parsedDate, 'dd')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{format(t.parsedDate, 'MMM yyyy')}</span>
                            <span className="text-xs text-muted-foreground">{format(t.parsedDate, 'HH:mm')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground text-base">{t.description}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary whitespace-nowrap text-base">
                        +{formatCurrency(t.amount).replace(',00', '')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground capitalize">
                          <div className={cn("w-2 h-2 rounded-full", t.source === 'manual' ? "bg-amber-500" : "bg-blue-500")} />
                          {t.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="text-muted-foreground hover:text-primary transition-colors font-semibold"
                          onClick={(e) => { e.stopPropagation(); setSelectedTx(t); }}
                        >
                          Details <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
              <span className="text-sm text-muted-foreground font-medium">
                Showing <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-bold text-foreground">{filteredData.length}</span> results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center shadow-sm",
                        currentPage === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-card border border-border rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto">
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-extrabold text-primary mb-3">
                    +{formatCurrency(selectedTx.amount).replace(',00', '')}
                  </h3>
                  <p className="text-2xl text-card-foreground font-bold">{selectedTx.description}</p>
                  <p className="text-muted-foreground text-base mt-2 font-medium">
                    {format(selectedTx.parsedDate, "EEEE, dd MMMM yyyy 'at' HH:mm")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                        <Tag className="w-4 h-4" /> Category
                      </div>
                      <p className="text-card-foreground font-bold text-lg">{selectedTx.category}</p>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                        <CreditCard className="w-4 h-4" /> Method
                      </div>
                      <p className="text-card-foreground font-bold text-lg capitalize">{selectedTx.paymentMethod}</p>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                        <Repeat className="w-4 h-4" /> Source
                      </div>
                      <p className="text-card-foreground font-bold text-lg capitalize">{selectedTx.source} Sync</p>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                        <FileText className="w-4 h-4" /> Note
                      </div>
                      <p className="text-card-foreground font-medium text-base truncate" title={selectedTx.note || "-"}>
                        {selectedTx.note || "No notes attached"}
                      </p>
                    </div>
                  </div>

                  {selectedTx.receiptImage && (
                    <div className="mt-4 bg-background p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-3 uppercase tracking-wide">
                        <ImageIcon className="w-4 h-4" /> Receipt Image
                      </div>
                      <div className="w-full h-36 bg-accent rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        {/* Placeholder for actual image */}
                        <span className="text-sm font-medium">{selectedTx.receiptImage}</span>
                      </div>
                    </div>
                  )}

                  {/* Example Recurring Info */}
                  {selectedTx.category === 'Gaji' && (
                    <div className="mt-4 bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-500 text-sm mb-2 font-bold uppercase tracking-wide">
                        <Repeat className="w-4 h-4" /> Recurring Income
                      </div>
                      <p className="text-blue-500/90 text-sm font-medium">
                        This is automatically tracked monthly. Next expected on <span className="font-bold">{format(endOfMonth(currentDate), 'dd MMM yyyy')}</span>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
