"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  CreditCard,
  Plus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency, dateToApiISO } from "@/lib/utils";
import { optimisticCreate, rollbackOnError } from "@/lib/optimistic";
import {
  validateString,
  validateNumber,
  runValidators,
} from "@/lib/validation";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { getCategoryIcon } from "@/lib/category-icons";
import { getLucideIcon } from "@/lib/category-lucide-icons";
import type { Category, Transaction } from "@/lib/types";
import {
  getThisMonthRange,
  getLastMonthRange,
  getThisYearRange,
  getLastYearRange,
} from "../helper/date.helper";
import { TransactionDetailModal } from "./components/detail-modal";
import { loadingExpensesScreen } from "./components/loading.component";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#22d3ee", "#f472b6"];

interface PaginatedTransactions {
  data: Transaction[];
  cursor?: string;
}

enum TimeFilter {
  thisMonth = "thisMonth",
  lastMonth = "lastMonth",
  thisYear = "thisYear",
  lastYear = "lastYear",
  allTime = "allTime",
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const currentDate = useMemo(() => new Date(), []);
  const addToast = useToastStore((s) => s.addToast);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter | null>(
    TimeFilter.thisMonth,
  );
  const TimeFilterLabels: Record<TimeFilter, string> = {
    [TimeFilter.thisMonth]: "This Month",
    [TimeFilter.lastMonth]: "Last Month",
    [TimeFilter.thisYear]: "This Year",
    [TimeFilter.lastYear]: "Last Year",
    [TimeFilter.allTime]: "All Time",
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // --- NEW BULLETPROOF PAGINATION STATE ---
  const [cursors, setCursors] = useState<string[]>([""]);
  const [pageIndex, setPageIndex] = useState(0);
  const activeCursor = cursors[pageIndex];
  // ----------------------------------------

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDesc, setAddDesc] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addInterval, setAddInterval] = useState<
    "none" | "daily" | "weekly" | "monthly" | "yearly"
  >("none");
  const [isAddSuccess, setIsAddSuccess] = useState(false);
  const addSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Helper to reset pagination when filters change
  const resetPagination = () => {
    setCursors([""]);
    setPageIndex(0);
  };

  const effectiveDates = useMemo(() => {
    if (timeFilter) {
      switch (timeFilter) {
        case TimeFilter.thisMonth:
          return getThisMonthRange(currentDate);
        case TimeFilter.lastMonth:
          return getLastMonthRange(currentDate);
        case TimeFilter.thisYear:
          return getThisYearRange(currentDate);
        case TimeFilter.lastYear:
          return getLastYearRange(currentDate);
        case TimeFilter.allTime:
          return { startDate: "", endDate: "" };
      }
    }
    return { startDate, endDate };
  }, [timeFilter, startDate, endDate, currentDate]);

  const { data: queryResult, isLoading } = useQuery<PaginatedTransactions>({
    queryKey: [
      "transactions",
      "EXPENSE",
      itemsPerPage,
      activeCursor,
      effectiveDates.startDate,
      effectiveDates.endDate,
    ],
    queryFn: async () => {
      const extra =
        effectiveDates.startDate !== "" && effectiveDates.endDate !== ""
          ? `&startDate=${effectiveDates.startDate}&endDate=${effectiveDates.endDate}`
          : "";
      return get<PaginatedTransactions>(
        `/transactions?type=EXPENSE&limit=${itemsPerPage}&cursorId=${activeCursor}${extra}`,
      );
    },
  });

  const transactions = useMemo(
    () => queryResult?.data || [],
    [queryResult?.data],
  );
  const nextCursorFromServer = queryResult?.cursor;

  const handleNextPage = () => {
    if (nextCursorFromServer) {
      setCursors((prev) => {
        const newCursors = [...prev];
        newCursors[pageIndex + 1] = nextCursorFromServer; // Save the new cursor for the next page
        return newCursors;
      });
      setPageIndex((p) => p + 1); // Move to next page
    }
  };

  const handlePrevPage = () => {
    setPageIndex((p) => Math.max(0, p - 1)); // Just decrement index, `activeCursor` will automatically grab the correct old cursor
  };

  // ... (keep mutations and useEffect for Escape key exactly the same)
  const optimisticIdRef = useRef(0);

  const createMutation = useMutation({
    mutationFn: (dto: {
      description: string;
      amount: number;
      type: "EXPENSE";
      date: string;
      categoryId?: string;
      interval?: string;
    }) => api.post("/transactions", dto),
    onMutate: async (dto) => {
      optimisticIdRef.current += 1;
      const temp: Transaction = {
        id: `opt-${optimisticIdRef.current}`,
        description: dto.description,
        amount: dto.amount,
        type: "EXPENSE",
        date: dto.date,
        categoryId: dto.categoryId || null,
        category:
          expenseCategories.find((c) => c.id === dto.categoryId) || null,
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
      }, 1500);
    },
  });

  const { data: expenseCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => get<Category[]>("/categories?type=EXPENSE"),
  });

  React.useEffect(() => {
    if (!selectedTx) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTx(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedTx]);

  const parsedData = useMemo(() => {
    return transactions.map((t) => ({ ...t, parsedDate: new Date(t.date) }));
  }, [transactions]);

  const filteredData = useMemo(() => {
    let filtered = parsedData.filter((t) => t.type === "EXPENSE");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description?.toLowerCase().includes(q) ?? false) ||
          (t.category?.name.toLowerCase().includes(q) ?? false),
      );
    }

    filtered.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    return filtered;
  }, [parsedData, searchQuery, currentDate]);

  const totalExpenses = filteredData.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );

  const trendData = useMemo(() => {
    const chronological = [...filteredData].sort(
      (a, b) => a.parsedDate.getTime() - b.parsedDate.getTime(),
    );
    const agg: Record<string, number> = {};

    chronological.forEach((t) => {
      const key =
        timeFilter === TimeFilter.thisYear || timeFilter === TimeFilter.allTime
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

  if (isLoading) {
    return loadingExpensesScreen();
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
          <p className="text-sm text-muted-foreground mt-1">
            Track and analyze your spending habits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border">
            {(Object.values(TimeFilter) as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setTimeFilter(filter);
                  resetPagination();
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  timeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-sky-500/[0.03]",
                )}
              >
                {TimeFilterLabels[filter]}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Date
            </label>
            <DatePicker
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                setTimeFilter(null);
                resetPagination();
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Date
            </label>
            <DatePicker
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                setTimeFilter(null);
                resetPagination();
              }}
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] hover:brightness-110 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
      >
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Expenses
          </p>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {formatCurrency(totalExpenses)}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              Transactions
            </p>
            <p className="text-xl font-bold text-foreground">
              {filteredData.length}
            </p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              Categories
            </p>
            <p className="text-xl font-bold text-foreground">
              {categoryData.length}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">
            Expense Trend
          </h3>
          <div className="h-[260px] w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  No data yet. Add expenses to see your spending trend over
                  time.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 0, right: 8, left: 4, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: number) =>
                      `${(val / 1000000).toFixed(1)}M`
                    }
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    width={45}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "var(--accent)" }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="amount" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">
            Category Breakdown
          </h3>
          <div className="h-[260px] w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <PieChart className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  No data yet. Expenses will be grouped by category here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="45%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Recent Expenses
            </h3>
            <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border">
              {[25, 50, 100].map((limit) => (
                <button
                  key={limit}
                  onClick={() => {
                    setItemsPerPage(limit);
                    resetPagination(); //
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    itemsPerPage === limit
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-sky-500/[0.03]",
                  )}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevPage}
                disabled={pageIndex === 0} // Disable if on the first page
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03] disabled:opacity-50 disabled:pointer-events-none transition-all"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-medium text-muted-foreground w-16 text-center">
                Page {pageIndex + 1}
              </span>

              <button
                onClick={handleNextPage}
                disabled={!nextCursorFromServer} // Disable if server says there is no next page
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03] disabled:opacity-50 disabled:pointer-events-none transition-all"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <SearchInput
              value={searchQuery}
              onChange={(v) => {
                setSearchQuery(v);
                resetPagination(); //
              }}
              placeholder="Search..."
              className="w-full sm:w-56"
            />
          </div>
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
              {filteredData.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTx(t)}
                  className="hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <td className="px-7 py-5 whitespace-nowrap font-medium">
                    {format(t.parsedDate, "dd MMM yyyy")}
                  </td>
                  <td className="px-7 py-5 font-bold">
                    {t.description || "-"}
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center gap-2 px-4 h-10 w-[160px] bg-accent text-foreground rounded-full text-sm font-bold border border-border">
                      {(() => {
                        const LucideIcon = getLucideIcon(t.category?.icon);
                        if (LucideIcon)
                          return (
                            <LucideIcon
                              className="w-9 h-9 text-primary shrink-0"
                              strokeWidth={2.5}
                            />
                          );
                        const icon = getCategoryIcon(t.category?.name);
                        if (icon)
                          return (
                            <img
                              src={icon}
                              alt=""
                              className="w-9 h-9 object-contain shrink-0"
                            />
                          );
                        return null;
                      })()}
                      <span className="truncate">
                        {t.category?.name || "Uncategorized"}
                      </span>
                    </span>
                  </td>
                  <td className="px-7 py-5 text-muted-foreground font-medium capitalize">
                    {t.source || "manual"}
                  </td>
                  <td className="px-7 py-5 text-right font-bold text-rose-500">
                    -{formatCurrency(Number(t.amount))}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
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
        onDelete={() =>
          queryClient.invalidateQueries({
            queryKey: ["transactions", "EXPENSE"],
          })
        }
        categories={expenseCategories}
      />

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddSuccess(false);
          setIsAddOpen(false);
        }}
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
              validateNumber(addAmount, "Amount", { min: 0.01 }),
            );
            if (err.length > 0) {
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
            <label className="text-sm font-medium text-foreground mb-1 block">
              Description
            </label>
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
            <label className="text-sm font-medium text-foreground mb-1 block">
              Amount
            </label>
            <CurrencyInput
              value={addAmount}
              onChange={setAddAmount}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Date
            </label>
            <DatePicker value={addDate} onChange={setAddDate} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Category
            </label>
            <select
              value={addCategoryId}
              onChange={(e) => setAddCategoryId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Select category</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Repeat
            </label>
            <select
              value={addInterval}
              onChange={(e) =>
                setAddInterval(
                  e.target.value as
                    "none" | "daily" | "weekly" | "monthly" | "yearly",
                )
              }
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
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
    </div>
  );
}
