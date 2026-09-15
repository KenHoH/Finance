"use client";

import React, { useState, useMemo } from "react";
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
import { TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";
import {
  getThisMonthRange,
  getLastMonthRange,
  getThisYearRange,
  getLastYearRange,
} from "../helper/date.helper";
import { TransactionDetailModal } from "./components/detail-modal";
import { loadingExpensesScreen } from "./components/loading.component";
import {
  TransactionFieldEditModal,
  type EditableTransactionField,
} from "@/components/common/TransactionFieldEditModal";
import FormExpenses from "./components/form-expenses";
import {
  ExpensesHeader,
  TimeFilter,
} from "./components/expenses-header";
import { ExpensesTable } from "./components/expenses-table";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#22d3ee", "#f472b6"];

interface PaginatedTransactions {
  data: Transaction[];
  cursor?: string;
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const currentDate = useMemo(() => new Date(), []);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter | null>(
    TimeFilter.thisMonth,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [cursors, setCursors] = useState<string[]>([""]);
  const [pageIndex, setPageIndex] = useState(0);
  const activeCursor = cursors[pageIndex];

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [fieldEdit, setFieldEdit] = useState<{
    transaction: Transaction;
    field: EditableTransactionField;
  } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddSuccess, setIsAddSuccess] = useState(false);

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
  }, [parsedData, searchQuery]);

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
      <ExpensesHeader
        startDate={startDate}
        endDate={endDate}
        timeFilter={timeFilter}
        onStartDateChange={(value) => {
          setStartDate(value);
          setTimeFilter(null);
          resetPagination();
        }}
        onEndDateChange={(value) => {
          setEndDate(value);
          setTimeFilter(null);
          resetPagination();
        }}
        onTimeFilterChange={(filter) => {
          setTimeFilter(filter);
          resetPagination();
        }}
        onAddExpense={() => setIsAddOpen(true)}
      />
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
      <ExpensesTable
        transactions={filteredData}
        itemsPerPage={itemsPerPage}
        pageIndex={pageIndex}
        hasNextPage={Boolean(nextCursorFromServer)}
        searchQuery={searchQuery}
        onItemsPerPageChange={(limit) => {
          setItemsPerPage(limit);
          resetPagination();
        }}
        onPreviousPage={handlePrevPage}
        onNextPage={handleNextPage}
        onSearchChange={(value) => {
          setSearchQuery(value);
          resetPagination();
        }}
        onSelectTransaction={setSelectedTx}
        onEditTransactionField={(transaction, field) =>
          setFieldEdit({ transaction, field })
        }
      />

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
      />

      <TransactionFieldEditModal
        transaction={fieldEdit?.transaction ?? null}
        field={fieldEdit?.field ?? null}
        categories={expenseCategories}
        onClose={() => setFieldEdit(null)}
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
        <FormExpenses
          setIsAddOpen={setIsAddOpen}
          setIsAddSuccess={setIsAddSuccess}
        ></FormExpenses>
      </Modal>
    </div>
  );
}
