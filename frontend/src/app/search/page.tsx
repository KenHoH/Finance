"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency, cn, unwrapArray } from "@/lib/utils";
import { formatDateDisplay } from "@/lib/helpers";
import { SearchInput } from "@/components/ui/SearchInput";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Transaction, Category } from "@/lib/types";

export default function SearchPage(){
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", "all"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions");
      return unwrapArray<Transaction>(res);
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async() => {
      const res = await get<unknown>("/categories");
      return unwrapArray<Category>(res);
    },
  });

  const filtered = useMemo(() => {
    let result = Array.isArray(transactions) ? transactions : [];

    if(typeFilter !== "ALL") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if(categoryFilter) {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    if(dateFrom) {
      result = result.filter((t) => t.date >= dateFrom);
    }
    if(dateTo) {
      result = result.filter((t) => t.date <= dateTo);
    }

    if(query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((t) =>
        t.description?.toLowerCase().includes(q) ||
        t.category?.name?.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    }

    return result;
  }, [transactions, query, typeFilter, categoryFilter, dateFrom, dateTo]);

  const totalAmount = filtered.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent transition-colors hover:bg-accent/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Search Transactions</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} results</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by description, category, or amount..."
            className="flex-1"
            autoFocus
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
              showFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
              {/* Type Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="ALL">All</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setTypeFilter("ALL");
                    setCategoryFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/80"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Summary */}
      {filtered.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-accent/30 px-4 py-2">
          <span className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span></span>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <LoadingState message="Searching..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/20"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{tx.description || "-"}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{formatDateDisplay(tx.date)}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span>{tx.category?.name || "Uncategorized"}</span>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold",
                  tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
