"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  CreditCard, ArrowDownRight, X, Pencil, Trash2, Camera, Plus, Upload, FileImage, Loader2, TrendingUp, MoreVertical
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { ScannedItem } from "@/lib/types";
import { format, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, put, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency, unwrapArray, dateToApiISO, apiDateToInput } from "@/lib/utils";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getCategoryIcon } from "@/lib/category-icons";
import { getLucideIcon } from "@/lib/category-lucide-icons";
import type { Category, Transaction } from "@/lib/types";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#22d3ee", "#f472b6"];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const currentDate = useMemo(() => new Date(), []);
  const addToast = useToastStore((s) => s.addToast);

  const [timeFilter, setTimeFilter] = useState<"thisMonth" | "lastMonth" | "thisYear" | "allTime">("thisMonth");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
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
    queryKey: ["transactions", "EXPENSE"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions?type=EXPENSE");
      return unwrapArray<Transaction>(res);
    },
  });

  const optimisticIdRef = useRef(0);

  const createMutation = useMutation({
    mutationFn: (dto: { description: string; amount: number; type: "EXPENSE"; date: string; categoryId?: string; interval?: string }) =>
      api.post("/transactions", dto),
    onMutate: async (dto) => {
      optimisticIdRef.current += 1;
      const temp: Transaction = {
        id: `opt-${optimisticIdRef.current}`,
        description: dto.description,
        amount: dto.amount,
        type: "EXPENSE",
        date: dto.date,
        categoryId: dto.categoryId || null,
        category: expenseCategories.find((c) => c.id === dto.categoryId) || null,
        source: "manual",
        isAutoTracked: false,
        createdAt: new Date().toISOString(),
      };
      await optimisticCreate(queryClient, ["transactions", "EXPENSE"], temp);
      await optimisticCreate(queryClient, ["transactions"], temp);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "EXPENSE"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to add expense"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
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
    },
  });

  const [isAddingScanned, setIsAddingScanned] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  async function handleAddScannedItems(){
    if(!scanItems.length) return;
    setIsAddingScanned(true);
    const date = addDate ? dateToApiISO(addDate) : new Date().toISOString();
    const catId = addCategoryId || undefined;
    for(const item of scanItems){
      const amt = Number(item.price) * (Number(item.quantity) || 1);
      await createMutation.mutateAsync({
        description: item.item.trim() || "Receipt item",
        amount: amt,
        type: "EXPENSE",
        date,
        categoryId: catId,
      });
    }
    setIsAddingScanned(false);
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
    addToast(`Added ${scanItems.length} expenses from receipt`, "success");
  }

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

  const { data: expenseCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => get<Category[]>("/categories?type=EXPENSE"),
  });

  React.useEffect(() => {
    if(!selectedTx) return;
    const handler = (e: KeyboardEvent) => { if(e.key === "Escape") setSelectedTx(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedTx]);

  const parsedData = useMemo(() => {
    return transactions.map((t) => ({ ...t, parsedDate: new Date(t.date) }));
  }, [transactions]);

  const filteredData = useMemo(() => {
    let filtered = parsedData.filter((t) => t.type === "EXPENSE");

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
        (t.category?.name.toLowerCase().includes(q) ?? false)
      );
    }

    filtered.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    return filtered;
  }, [parsedData, timeFilter, searchQuery, currentDate]);

  const totalExpenses = filteredData.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const trendData = useMemo(() => {
    const chronological = [...filteredData].sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    const agg: Record<string, number> = {};

    chronological.forEach((t) => {
      const key = timeFilter === "thisYear" || timeFilter === "allTime" ? format(t.parsedDate, "MMM yyyy") : format(t.parsedDate, "dd MMM");
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
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-red-400" />
            </div>
            Expenses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track and analyze your spending habits</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border overflow-x-auto">
            {(["thisMonth", "lastMonth", "thisYear", "allTime"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => { setTimeFilter(filter); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  timeFilter === filter ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sky-500/[0.03]"
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
            className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] hover:brightness-110 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </header>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalExpenses)}</h2>
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
          <h3 className="text-base font-semibold text-foreground mb-4">Expense Trend</h3>
          <div className="h-[260px] w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground max-w-[200px]">No data yet. Add expenses to see your spending trend over time.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 0, right: 8, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val: number) => `${(val/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} width={45} />
                  <RechartsTooltip cursor={{ fill: "var(--accent)" }} formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="amount" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
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
                <p className="text-sm text-muted-foreground max-w-[200px]">No data yet. Expenses will be grouped by category here.</p>
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
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row justify-between gap-5">
          <h3 className="text-sm font-semibold text-foreground">Recent Expenses</h3>
          <SearchInput
            value={searchQuery}
            onChange={(v) => setSearchQuery(v)}
            placeholder="Search..."
            className="w-full sm:w-56"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-base font-semibold">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-7 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((t) => (
                <tr key={t.id} onClick={() => setSelectedTx(t)} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                  <td className="px-7 py-5 whitespace-nowrap font-medium">{format(t.parsedDate, "dd MMM yyyy")}</td>
                  <td className="px-7 py-5 font-bold">{t.description || "-"}</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-foreground rounded-full text-sm font-bold border border-border">
                      {(() => {
                        const LucideIcon = getLucideIcon(t.category?.icon);
                        if(LucideIcon) return <LucideIcon className="w-5 h-5 text-primary" />;
                        const icon = getCategoryIcon(t.category?.name);
                        if(icon) return <img src={icon} alt="" className="w-5 h-5 object-contain" />;
                        return null;
                      })()}
                      {t.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-7 py-5 text-muted-foreground font-medium capitalize">{t.source || "manual"}</td>
                  <td className="px-7 py-5 text-right font-bold text-rose-500">-{formatCurrency(Number(t.amount))}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-9">
                    <EmptyState
                      title="No expenses found"
                      description="Record your first expense to start tracking your spending."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <TransactionDetailModal
        selectedTx={selectedTx}
        onClose={() => setSelectedTx(null)}
        queryClient={queryClient}
        onDelete={() => queryClient.invalidateQueries({ queryKey: ["transactions", "EXPENSE"] })}
        categories={expenseCategories}
      />

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddSuccess(false); setIsAddOpen(false); }}
        title="Add Expense"
        description="Record a new expense transaction."
        isSuccess={isAddSuccess}
        successMessage="Expense successfully added!"
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
              type: "EXPENSE",
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
              placeholder="e.g. Grocery shopping"
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
              {expenseCategories.map((c) => (
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
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{scanItems.length} items extracted</p>
                        <p className="text-xs text-muted-foreground">Total: {formatCurrency(scanItems.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0))}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsReviewOpen(true)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Review Items
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddScannedItems}
                      disabled={isAddingScanned}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isAddingScanned ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Adding items...</>
                      ) : (
                        <><Plus className="w-4 h-4" /> Add all as expenses</>
                      )}
                    </button>
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
              {createMutation.isPending ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </Modal>

      <ReviewItemsModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        items={scanItems}
        onChange={setScanItems}
        onAddAll={() => { setIsReviewOpen(false); handleAddScannedItems(); }}
        isAdding={isAddingScanned}
      />
    </div>
  );
}

function TransactionDetailModal({
  selectedTx,
  onClose,
  onDelete,
  categories,
  queryClient,
}: {
  selectedTx: Transaction | null;
  onClose: () => void;
  onDelete: () => void;
  categories: Category[];
  queryClient: ReturnType<typeof useQueryClient>;
}){
  const addToast = useToastStore((s) => s.addToast);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(false);
    }
    if(menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/transactions/${id}`),
    onMutate: async (id) => {
      await optimisticDelete(queryClient, ["transactions", "EXPENSE"], id);
      await optimisticDelete(queryClient, ["transactions"], id);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "EXPENSE"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to delete"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onDelete();
      onClose();
    },
    onSuccess: () => {
      addToast("Transaction deleted", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; description: string; amount: number; date?: string; categoryId?: string }) =>
      put(`/transactions/${dto.id}`, { description: dto.description, amount: dto.amount, date: dto.date, categoryId: dto.categoryId }),
    onMutate: async (dto) => {
      const patch = { description: dto.description, amount: dto.amount, date: dto.date, categoryId: dto.categoryId };
      await optimisticUpdate(queryClient, ["transactions", "EXPENSE"], dto.id, patch);
      await optimisticUpdate(queryClient, ["transactions"], dto.id, patch);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "EXPENSE"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to update"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onDelete();
      setIsEditing(false);
    },
    onSuccess: () => {
      onClose();
      addToast("Transaction updated", "success");
    },
  });

  if(!selectedTx) return null;

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      <motion.div key="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-xl shadow-2xl z-50 p-7 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><ArrowDownRight className="w-6 h-6" /></div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="p-2 hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setIsEditing(true); setEditDesc(selectedTx.description || ""); setEditAmount(String(selectedTx.amount)); setEditDate(apiDateToInput(selectedTx.date)); setEditCategoryId(selectedTx.categoryId || ""); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-sky-500/[0.05] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-sky-400" /> Edit
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }}
                      disabled={deleteMutation.isPending}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-sky-500/[0.05] rounded-lg transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
              <CurrencyInput value={editAmount} onChange={setEditAmount} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
              <DatePicker value={editDate} onChange={(val) => setEditDate(val)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
              <button onClick={() => {
                const err = validateNumber(editAmount, "Amount", { min: 0.01 });
                if(err){
                  addToast(err.message, "error");
                  return;
                }
                updateMutation.mutate({ id: selectedTx.id, description: editDesc.trim(), amount: Number(editAmount), date: editDate ? dateToApiISO(editDate) : undefined, categoryId: editCategoryId || undefined });
              }} disabled={updateMutation.isPending} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">Save</button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-red-400 mb-2">-{formatCurrency(Number(selectedTx.amount))}</h3>
              <p className="text-xl font-bold">{selectedTx.description || "-"}</p>
              <p className="text-sm text-muted-foreground mt-1">{format(new Date(selectedTx.date), "dd MMMM yyyy, HH:mm")}</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-background p-4 rounded-xl border border-border"><p className="text-sm text-muted-foreground mb-1 uppercase font-bold">Category</p><p className="font-bold">{selectedTx.category?.name || "Uncategorized"}</p></div>
              <div className="bg-background p-4 rounded-xl border border-border"><p className="text-sm text-muted-foreground mb-1 uppercase font-bold">Source</p><p className="font-bold capitalize">{selectedTx.source || "Manual"}</p></div>
            </div>
          </>
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onConfirm={() => { if(selectedTx) deleteMutation.mutate(selectedTx.id); }}
          onCancel={() => setShowDeleteConfirm(false)}
          title="Delete transaction?"
          description={`Are you sure you want to delete ${selectedTx?.description || "this transaction"}? This action cannot be undone.`}
          confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
          variant="danger"
        />
      </motion.div>
    </AnimatePresence>
  );
}

function ReviewItemsModal({
  isOpen,
  onClose,
  items,
  onChange,
  onAddAll,
  isAdding,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: ScannedItem[];
  onChange: (items: ScannedItem[]) => void;
  onAddAll: () => void;
  isAdding: boolean;
}){
  if(!isOpen) return null;

  function updateItem(index: number, field: keyof ScannedItem, value: string | number){
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function removeItem(index: number){
    onChange(items.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
      <motion.div key="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card border border-border rounded-xl shadow-2xl z-[70] p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">Review Items</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-sky-500/[0.05] rounded-lg transition-colors" aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-3 mb-5">
          {items.map((item, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.item}
                  onChange={(e) => updateItem(i, "item", e.target.value)}
                  className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary"
                  placeholder="Item name"
                />
                <button onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0" aria-label="Remove item">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-semibold">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity || 1}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[10px] uppercase text-muted-foreground font-semibold">Price</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.price}
                    onChange={(e) => updateItem(i, "price", Number(e.target.value))}
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-sm font-semibold text-foreground">Total: {formatCurrency(total)}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
            <button onClick={onAddAll} disabled={isAdding || items.length === 0} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
              {isAdding ? "Adding..." : "Add all"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
