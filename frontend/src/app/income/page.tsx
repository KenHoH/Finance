"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  ChevronLeft, ChevronRight,
  ArrowUpRight, X, Tag, FileText, Wallet, CalendarRange, ArrowUpCircle, Pencil, Trash2, Plus, Camera, Upload, FileImage, Loader2, TrendingUp
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { format, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency, unwrapArray, dateToApiISO, apiDateToInput } from "@/lib/utils";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getCategoryIcon } from "@/lib/category-icons";
import type { Category, Transaction, ScannedItem } from "@/lib/types";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#22d3ee", "#f472b6"];

export default function IncomePage() {
  const currentDate = useMemo(() => new Date(), []);
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [timeFilter, setTimeFilter] = useState<"thisMonth" | "lastMonth" | "thisYear" | "allTime">("thisMonth");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDesc, setAddDesc] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addInterval, setAddInterval] = useState<"none" | "daily" | "weekly" | "monthly" | "yearly">("none");
  const [isAddSuccess, setIsAddSuccess] = useState(false);
  const addSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showScanSection, setShowScanSection] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState("");
  const [scanItems, setScanItems] = useState<ScannedItem[]>([]);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const scanFileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 6;

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", "INCOME"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions?type=INCOME");
      return unwrapArray<Transaction>(res);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; description?: string; amount: number; date?: string; categoryId?: string }) => {
      const { id, ...body } = dto;
      return api.put(`/transactions/${id}`, body);
    },
    onMutate: async (dto) => {
      const patch = { description: dto.description, amount: dto.amount, date: dto.date, categoryId: dto.categoryId };
      await optimisticUpdate(queryClient, ["transactions", "INCOME"], dto.id, patch);
      await optimisticUpdate(queryClient, ["transactions"], dto.id, patch);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "INCOME"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to update transaction"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onSuccess: () => {
      setIsEditing(false);
      addToast("Transaction updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onMutate: async (id) => {
      await optimisticDelete(queryClient, ["transactions", "INCOME"], id);
      await optimisticDelete(queryClient, ["transactions"], id);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "INCOME"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to delete transaction"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onSuccess: () => {
      setSelectedTx(null);
      addToast("Transaction deleted", "success");
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: { description: string; amount: number; type: "INCOME"; date: string; categoryId?: string; interval?: string }) =>
      api.post("/transactions", dto),
    onMutate: async (dto) => {
      const temp: Transaction = {
        id: `opt-${Date.now()}`,
        description: dto.description,
        amount: dto.amount,
        type: "INCOME",
        date: dto.date,
        categoryId: dto.categoryId || null,
        category: incomeCategories.find((c) => c.id === dto.categoryId) || null,
        source: "manual",
        isAutoTracked: false,
        createdAt: new Date().toISOString(),
      };
      await optimisticCreate(queryClient, ["transactions", "INCOME"], temp);
      await optimisticCreate(queryClient, ["transactions"], temp);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "INCOME"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to add income"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onSuccess: () => {
      setIsAddSuccess(true);
      addSuccessTimeoutRef.current = setTimeout(() => {
        setIsAddSuccess(false);
        setIsAddOpen(false);
        setAddDesc("");
        setAddAmount("");
        setAddDate("");
        setAddCategoryId("");
        setAddInterval("none");
        setShowScanSection(false);
        setScanFile(null);
        setScanPreview("");
        setScanItems([]);
      }, 1500);
      addToast("Income added", "success");
    },
  });

  const scanMutation = useMutation({
    mutationFn: async(file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/receipts/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setIsScanningReceipt(false);
      let extractedItems: ScannedItem[] = [];
      if(data?.items && Array.isArray(data.items)){
        extractedItems = data.items;
      } else if(data?.item){
        extractedItems = [{ item: data.item, price: data.price || 0, quantity: data.quantity || 1 }];
      }
      setScanItems(extractedItems);
      if(extractedItems.length > 0){
        const total = extractedItems.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);
        setAddAmount(String(total));
        const firstItemName = extractedItems[0].item;
        if(!addDesc) setAddDesc(firstItemName);
        addToast(`Extracted ${extractedItems.length} items from receipt`, "success");
      } else {
        addToast("Could not extract receipt data", "warning");
      }
    },
    onError: (err) => {
      setIsScanningReceipt(false);
      addToast(extractApiError(err, "Failed to scan receipt"), "error");
    },
  });

  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if(!allowed.includes(f.type)){
      addToast("Only PNG, JPEG, and WebP images are allowed", "error");
      return;
    }
    if(f.size > 5 * 1024 * 1024){
      addToast("File must be under 5MB", "error");
      return;
    }
    setScanFile(f);
    setScanPreview(URL.createObjectURL(f));
    setScanItems([]);
  };

  const handleScanReceipt = () => {
    if(!scanFile) return;
    setIsScanningReceipt(true);
    scanMutation.mutate(scanFile);
  };

  const { data: incomeCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", "INCOME"],
    queryFn: () => get<Category[]>("/categories?type=INCOME"),
  });

  React.useEffect(() => {
    if(!selectedTx) return;
    const handler = (e: KeyboardEvent) => { if(e.key === "Escape") setSelectedTx(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedTx]);

  const parsedData = useMemo(() => {
    return transactions.map((t) => ({
      ...t,
      parsedDate: new Date(t.date),
    }));
  }, [transactions]);

  const filteredData = useMemo(() => {
    let filtered = parsedData.filter((t) => t.type === "INCOME");

    if(timeFilter === "thisMonth") {
      filtered = filtered.filter((t) => isWithinInterval(t.parsedDate, { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }));
    } else if(timeFilter === "lastMonth") {
      const lastMonth = subMonths(currentDate, 1);
      filtered = filtered.filter((t) => isWithinInterval(t.parsedDate, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }));
    } else if(timeFilter === "thisYear") {
      filtered = filtered.filter((t) => isWithinInterval(t.parsedDate, { start: startOfYear(currentDate), end: endOfYear(currentDate) }));
    }

    if(searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.description?.toLowerCase().includes(q) ?? false) ||
        (t.category?.name.toLowerCase().includes(q) ?? false) ||
        (t.source?.toLowerCase().includes(q) ?? false)
      );
    }

    filtered.sort((a, b) => {
      const valA = sortField === "date" ? a.parsedDate.getTime() : a.amount;
      const valB = sortField === "date" ? b.parsedDate.getTime() : b.amount;
      if(valA < valB) return sortDir === "asc" ? -1 : 1;
      if(valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [parsedData, timeFilter, sortField, sortDir, searchQuery, currentDate]);

  const totalIncome = filteredData.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const chartData = useMemo(() => {
    const chronological = [...filteredData].sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    const agg: Record<string, number> = {};

    chronological.forEach((t) => {
      const key = timeFilter === "thisYear" || timeFilter === "allTime"
        ? format(t.parsedDate, "MMM yyyy")
        : format(t.parsedDate, "dd MMM");
      agg[key] = (agg[key] || 0) + Number(t.amount);
    });

    return Object.entries(agg).map(([date, amount]) => ({ date, amount }));
  }, [filteredData, timeFilter]);

  const categoryData = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach((t) => {
      const name = t.category?.name || "Uncategorized";
      agg[name] = (agg[name] || 0) + Number(t.amount);
    });
    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    if(currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredData.length, currentPage, totalPages]);

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[320px]" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="text-foreground font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <Wallet className="w-5 h-5 text-sky-400" />
              </div>
              Income
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor and track your revenue streams</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border">
              {(["thisMonth", "lastMonth", "thisYear", "allTime"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    timeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-sky-500/[0.03]"
                  )}
                >
                  {filter === "thisMonth" && "This Month"}
                  {filter === "lastMonth" && "Last Month"}
                  {filter === "thisYear" && "This Year"}
                  {filter === "allTime" && "All Time"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-sky-500 text-background px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] hover:brightness-110 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Income
            </button>
          </div>
        </header>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalIncome)}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold text-foreground">{filteredData.length}</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <p className="text-xl font-bold text-foreground">{categoryData.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Trend */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
            <h3 className="text-base font-semibold text-foreground mb-4">Income Trend</h3>
            <div className="h-[260px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground max-w-[200px]">No data yet. Add income to see your earnings trend over time.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 4, bottom: 8 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} tickFormatter={(val: number) => `${(val / 1000000).toFixed(1)}M`} width={45} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", color: "var(--card-foreground)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} itemStyle={{ color: "var(--primary)", fontWeight: 600 }} formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
            <h3 className="text-base font-semibold text-foreground mb-4">Category Breakdown</h3>
            <div className="h-[260px] w-full">
              {categoryData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <PieChart className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground max-w-[200px]">No data yet. Income will be grouped by category here.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="45%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card overflow-hidden mb-12"
        >
          {/* Table Toolbar */}
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5 text-muted-foreground" />
              Recent Transactions
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              <SearchInput
                value={searchQuery}
                onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                placeholder="Search transactions..."
                className="w-full sm:w-56"
              />

              <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => {
                    if(sortField === "date") {
                      setSortDir((d) => d === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("date");
                      setSortDir("desc");
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1",
                    sortField === "date" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Date {sortField === "date" && (sortDir === "asc" ? " ?" : " ?")}
                </button>
                <button
                  onClick={() => {
                    if(sortField === "amount") {
                      setSortDir((d) => d === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("amount");
                      setSortDir("desc");
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1",
                    sortField === "amount" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Amount {sortField === "amount" && (sortDir === "asc" ? " ?" : " ?")}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-sm text-muted-foreground bg-muted/50 border-b border-border uppercase font-semibold">
                <tr>
                  <th className="px-7 py-5 tracking-wider">Date</th>
                  <th className="px-7 py-5 tracking-wider">Description</th>
                  <th className="px-7 py-5 tracking-wider">Category</th>
                  <th className="px-7 py-5 tracking-wider text-right">Amount</th>
                  <th className="px-7 py-5 tracking-wider">Source</th>
                  <th className="px-7 py-5 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8">
                        <EmptyState
                          title="No income transactions found"
                          description="Record your first income to start tracking your earnings."
                        />
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
                      <td className="px-7 py-5 whitespace-nowrap text-foreground">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shadow-sm">
                            {format(t.parsedDate, "dd")}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{format(t.parsedDate, "MMM yyyy")}</span>
                            <span className="text-sm text-muted-foreground">{format(t.parsedDate, "HH:mm")}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-7 py-5 font-semibold text-foreground text-base">{t.description || "-"}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/20">
                          {getCategoryIcon(t.category?.name) && (
                            <img src={getCategoryIcon(t.category?.name)} alt="" className="w-10 h-10 object-contain" />
                          )}
                          {t.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-7 py-5 text-right font-bold text-primary whitespace-nowrap text-base">
                        +{formatCurrency(Number(t.amount))}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground capitalize">
                          <div className={cn("w-2 h-2 rounded-full", t.isAutoTracked ? "bg-sky-500" : "bg-sky-500")} />
                          {t.source?.toLowerCase() || "manual"}
                        </span>
                      </td>
                      <td className="px-7 py-5 text-right">
                        <button
                          className="text-muted-foreground hover:text-primary transition-colors font-semibold"
                          onClick={(e) => { e.stopPropagation(); setSelectedTx(t); }}
                        >
                          Details <span className="opacity-0 group-hover:opacity-100 transition-opacity">-&gt;</span>
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto">
                {!isEditing ? (
                  <>
                    <div className="text-center mb-8">
                      <h3 className="text-3xl font-bold text-primary mb-3">
                        +{formatCurrency(Number(selectedTx.amount))}
                      </h3>
                      <p className="text-2xl text-card-foreground font-bold">{selectedTx.description || "-"}</p>
                      <p className="text-muted-foreground text-base mt-2 font-medium">
                        {format(new Date(selectedTx.date), "EEEE, dd MMMM yyyy 'at' HH:mm")}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-background p-4 rounded-xl border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                            <Tag className="w-5 h-5" /> Category
                          </div>
                          <p className="text-card-foreground font-bold text-lg">{selectedTx.category?.name || "Uncategorized"}</p>
                        </div>
                        <div className="bg-background p-4 rounded-xl border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                            <FileText className="w-5 h-5" /> Source
                          </div>
                          <p className="text-card-foreground font-bold text-lg capitalize">{selectedTx.source || "Manual"}</p>
                        </div>
                        <div className="bg-background p-4 rounded-xl border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                            <Tag className="w-5 h-5" /> Tracking
                          </div>
                          <p className="text-card-foreground font-bold text-lg">{selectedTx.isAutoTracked ? "Auto" : "Manual"}</p>
                        </div>
                        <div className="bg-background p-4 rounded-xl border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide">
                            <FileText className="w-5 h-5" /> Type
                          </div>
                          <p className="text-card-foreground font-bold text-lg">{selectedTx.type}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 mt-8">
                      <button
                        onClick={() => { setIsEditing(true); setEditDesc(selectedTx.description || ""); setEditAmount(String(selectedTx.amount)); setEditDate(apiDateToInput(selectedTx.date)); setEditCategoryId(selectedTx.categoryId || ""); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Pencil className="w-5 h-5" /> Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" /> Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Edit Transaction</h3>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
                      <CurrencyInput
                        value={editAmount}
                        onChange={setEditAmount}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
                      <DatePicker
                        value={editDate}
                        onChange={(val) => setEditDate(val)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Select category</option>
                        {incomeCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
                      <button
                        onClick={() => {
                          const err = validateNumber(editAmount, "Amount", { min: 0.01 });
                          if(err){
                            addToast(err.message, "error");
                            return;
                          }
                          updateMutation.mutate({ id: selectedTx.id, description: editDesc.trim(), amount: Number(editAmount), date: editDate ? dateToApiISO(editDate) : undefined, categoryId: editCategoryId || undefined });
                        }}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(selectedTx) deleteMutation.mutate(selectedTx.id); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete transaction?"
        description={`Are you sure you want to delete ${selectedTx?.description || "this transaction"}? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />

      {/* Add Income Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddSuccess(false); setIsAddOpen(false); }}
        title="Add Income"
        description="Record a new income transaction."
        isSuccess={isAddSuccess}
        successMessage="Income successfully added!"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const err = runValidators(
              validateString(addDesc, "Description", { min: 1, max: 100 }),
              validateNumber(addAmount, "Amount", { min: 0.01 })
            );
            if(err.length > 0){
              addToast(err[0].message, "error");
              return;
            }
            createMutation.mutate({
              description: addDesc.trim(),
              amount: Number(addAmount),
              type: "INCOME",
              date: addDate ? dateToApiISO(addDate) : new Date().toISOString(),
              categoryId: addCategoryId || undefined,
              interval: addInterval === "none" ? undefined : addInterval,
            });
          }}
        >
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
            <input
              type="text"
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              placeholder="e.g. Freelance payment"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
            <CurrencyInput
              value={addAmount}
              onChange={setAddAmount}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
            <DatePicker value={addDate} onChange={setAddDate} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
            <select
              value={addCategoryId}
              onChange={(e) => setAddCategoryId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Select category</option>
              {incomeCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Repeat</label>
            <select
              value={addInterval}
              onChange={(e) => setAddInterval(e.target.value as "none" | "daily" | "weekly" | "monthly" | "yearly")}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Inline Receipt Scan */}
          <div className="border border-border rounded-xl p-3 space-y-3">
            <button
              type="button"
              onClick={() => setShowScanSection(!showScanSection)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Camera className="w-4 h-4" />
              {showScanSection ? "Hide receipt scan" : "Scan receipt to auto-fill"}
            </button>

            {showScanSection && (
              <div className="space-y-3">
                {!scanFile && (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-card"
                    onClick={() => scanFileInputRef.current?.click()}
                  >
                    <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
                    <p className="text-xs text-muted-foreground">PNG, JPEG, WebP up to 5MB</p>
                    <input ref={scanFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScanFileChange} />
                  </div>
                )}

                {scanPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-card">
                    <img src={scanPreview} alt="Receipt preview" className="w-full max-h-48 object-contain bg-black/20" />
                    <button
                      type="button"
                      onClick={() => { setScanFile(null); setScanPreview(""); setScanItems([]); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-sky-400 hover:bg-black/80 transition-colors"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {scanFile && scanItems.length === 0 && !isScanningReceipt && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleScanReceipt}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all active:scale-[0.98]"
                    >
                      <Upload className="w-4 h-4" /> Scan Receipt
                    </button>
                  </div>
                )}

                {isScanningReceipt && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Scanning receipt...</span>
                  </div>
                )}

                {scanItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Extracted Items</p>
                    {scanItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{item.item}</span>
                        <span className="text-muted-foreground">x{item.quantity || 1}</span>
                        <span className="font-medium">{formatCurrency(Number(item.price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? "Adding..." : "Add Income"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
