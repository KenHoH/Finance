"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  CalendarRange, Search, Receipt, ArrowDownCircle, ArrowDownRight, X, Image as ImageIcon,
  CreditCard, Repeat, Tag, FileText
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { expenseTransactions } from "@/dummy-data/src/data/expenses";
import { cn } from "@/lib/utils";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const COLORS = ['#f43f5e', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export default function ExpensesPage() {
  const currentDate = new Date("2025-05-11T12:00:00Z");

  const [timeFilter, setTimeFilter] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime'>('thisMonth');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const itemsPerPage = 6;

  // 1. Process Data
  const parsedData = useMemo(() => {
    return expenseTransactions.map(t => ({ ...t, parsedDate: parseISO(t.date) }));
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
        t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }

    // Sort by date desc
    filtered.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    return filtered;
  }, [parsedData, timeFilter, searchQuery]);

  // 2. Metrics & Charts
  const totalExpenses = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  const trendData = useMemo(() => {
    const chronological = [...filteredData].sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    const agg: Record<string, number> = {};

    chronological.forEach(t => {
      const key = timeFilter === 'thisYear' || timeFilter === 'allTime' ? format(t.parsedDate, 'MMM yyyy') : format(t.parsedDate, 'dd MMM');
      agg[key] = (agg[key] || 0) + t.amount;
    });

    return Object.entries(agg).map(([date, amount]) => ({ date, amount }));
  }, [filteredData, timeFilter]);

  const categoryData = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(t => {
      agg[t.category] = (agg[t.category] || 0) + t.amount;
    });
    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // 3. Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <Receipt className="w-7 h-7 text-rose-500" />
            </div>
            Expenses Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-base">Track and analyze your spending habits</p>
        </div>

        <div className="flex items-center gap-2 bg-card p-2 rounded-2xl border border-border shadow-sm overflow-x-auto">
          {(['thisMonth', 'lastMonth', 'thisYear', 'allTime'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => { setTimeFilter(filter); setCurrentPage(1); }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                timeFilter === filter ? "bg-rose-500 text-white shadow-md" : "text-muted-foreground hover:bg-accent"
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

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Expenses Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <ArrowDownRight className="w-32 h-32 text-rose-500" />
          </div>
          <div className="flex items-center gap-2 text-rose-500 font-semibold mb-4">
            <ArrowDownCircle className="w-5 h-5" /> <span>Total Expenses</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-card-foreground tracking-tight mb-4 z-10">
            {formatCurrency(totalExpenses).replace(',00', '')}
          </h2>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2 z-10">
            <CalendarRange className="w-4 h-4" /> Period Total
          </p>
        </motion.div>

        {/* Categories Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trend Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Expense Trend</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer>
            <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(1)}M`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <RechartsTooltip cursor={{ fill: 'var(--accent)' }} formatter={(val: number) => formatCurrency(val)} />
              <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-muted/30">
          <h3 className="text-xl font-bold flex items-center gap-2">Recent Expenses</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-background border border-border text-sm rounded-xl pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((t) => (
                <tr key={t.id} onClick={() => setSelectedTx(t)} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{format(t.parsedDate, 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 font-bold">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-accent text-foreground rounded-full text-xs font-bold border border-border">{t.category}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-medium capitalize">{t.paymentMethod}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-500">-{formatCurrency(t.amount).replace(',00', '')}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTx(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-3xl shadow-2xl z-50 p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500"><ArrowDownRight className="w-6 h-6" /></div>
                <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-accent rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-4xl font-extrabold text-rose-500 mb-2">-{formatCurrency(selectedTx.amount).replace(',00', '')}</h3>
                <p className="text-xl font-bold">{selectedTx.description}</p>
                <p className="text-sm text-muted-foreground mt-1">{format(selectedTx.parsedDate, "dd MMMM yyyy, HH:mm")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Category</p><p className="font-bold">{selectedTx.category}</p></div>
                <div className="bg-background p-4 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Method</p><p className="font-bold capitalize">{selectedTx.paymentMethod}</p></div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
