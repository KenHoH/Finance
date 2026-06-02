"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Plus, Edit2, Trash2, CheckCircle2, Loader2, AlertTriangle, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency, dateToApiISO, apiDateToInput } from "@/lib/utils";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormField } from "@/components/ui/FormField";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Category, Budget } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";
import { getCategoryIcon } from "@/lib/category-icons";

export default function BudgetsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [viewCategoryId, setViewCategoryId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuId(null);
    }
    if(activeMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeMenuId]);

  interface BudgetDetail {
    id: string;
    amount: number;
    startDate: string;
    endDate: string;
    spent: number;
    remaining: number;
    percentage: number;
    status: string;
  }

  interface AggregatedBudget {
    category: { id: string; name: string; icon: string | null } | null;
    totalAmount: number;
    startDate: string;
    endDate: string;
    spent: number;
    remaining: number;
    percentage: number;
    status: string;
    budgets: BudgetDetail[];
  }

  const { data: aggregated = [], isLoading } = useQuery<AggregatedBudget[]>({
    queryKey: ["budgets", "aggregated"],
    queryFn: () => get<AggregatedBudget[]>("/budgets/aggregated"),
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const totalBudgeted = aggregated.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const optimisticIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { amount: number; startDate: string; endDate: string; categoryId?: string }) =>
      api.post("/budgets", dto),
    onMutate: async (dto) => {
      const temp: Budget = {
        id: `opt-${++optimisticIdRef.current}`,
        amount: dto.amount,
        startDate: dto.startDate,
        endDate: dto.endDate,
        categoryId: dto.categoryId || null,
        category: categories.find((c) => c.id === dto.categoryId) || null,
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["budgets"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["budgets"], context);
      setFormError(extractApiError(err, "Failed to create budget"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgets", "aggregated"] });
    },
    onSuccess: () => {
      setFormError("");
      setIsSuccess(true);
      setCategoryId("");
      setAmount("");
      setStartDate("");
      setEndDate("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; amount: number; startDate: string; endDate: string }) => {
      const { id, ...body } = dto;
      return api.put(`/budgets/${id}`, body);
    },
    onMutate: async (dto) => optimisticUpdate(queryClient, ["budgets"], dto.id, { amount: dto.amount, startDate: dto.startDate, endDate: dto.endDate }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["budgets"], context);
      setFormError(extractApiError(err, "Failed to update budget"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgets", "aggregated"] });
    },
    onSuccess: () => {
      setFormError("");
      setEditBudget(null);
      setEditAmount("");
      setEditStart("");
      setEditEnd("");
      addToast("Budget updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["budgets"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["budgets"], context);
      addToast(extractApiError(err, "Failed to delete budget"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgets", "aggregated"] });
    },
    onSuccess: () => {
      addToast("Budget deleted", "success");
    },
  });

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {[0,1,2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <PieChart className="w-5 h-5 text-sky-400" />
            </div>
            Budgets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Control your spending limits per category</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> Create Budget
        </button>
      </header>

      {/* Create Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFormError(""); setFieldErrors({}); }}
        title="Create New Budget"
        description="Set a spending limit for a specific category."
        isSuccess={isSuccess}
        successMessage="Budget successfully created!"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateNumber(amount, "Amount", { min: 0.01 }),
              validateString(startDate, "Start Date"),
              validateString(endDate, "End Date")
            );
            const mapped: Record<string, string> = {};
            errors.forEach((err) => { mapped[err.field] = err.message; });
            if(new Date(startDate) > new Date(endDate)){
              mapped["endDate"] = "Start date must be before end date";
            }
            setFieldErrors(mapped);
            setFormError("");
            if(Object.keys(mapped).length > 0) return;
            createMutation.mutate({
              amount: Number(amount),
              startDate,
              endDate,
              categoryId: categoryId || undefined,
            });
          }}
        >
          <FormField label="Category" htmlFor="budget-category" error={fieldErrors["Category"]}>
            <select
              id="budget-category"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n["Category"]; return n; }); setFormError(""); }}
              className={cn(
                "w-full px-4 py-3 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all text-base font-medium",
                fieldErrors["Category"] ? "border-rose-500 focus:border-rose-500" : "border-border focus:border-primary"
              )}
            >
              <option value="">Overall (no category)</option>
              {categories.filter((c) => c.type === "EXPENSE").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Monthly Limit" htmlFor="budget-amount" error={fieldErrors["Amount"]}>
            <CurrencyInput
              id="budget-amount"
              value={amount}
              onChange={(v: string) => { setAmount(v); setFieldErrors((prev) => { const n = { ...prev }; delete n["Amount"]; return n; }); setFormError(""); }}
              placeholder="0"
              className={cn(
                fieldErrors["Amount"] ? "[&_input]:border-rose-500 [&_input]:focus:border-rose-500" : ""
              )}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" htmlFor="budget-start" error={fieldErrors["Start Date"]}>
              <DatePicker
                id="budget-start"
                value={startDate}
                onChange={(val) => { setStartDate(val); setFieldErrors((prev) => { const n = { ...prev }; delete n["Start Date"]; return n; }); setFormError(""); }}
                className={cn(
                  fieldErrors["Start Date"] ? "border-rose-500 focus:border-rose-500" : ""
                )}
              />
            </FormField>
            <FormField label="End Date" htmlFor="budget-end" error={fieldErrors["End Date"]}>
              <DatePicker
                id="budget-end"
                value={endDate}
                onChange={(val) => { setEndDate(val); setFieldErrors((prev) => { const n = { ...prev }; delete n["End Date"]; return n; }); setFormError(""); }}
                className={cn(
                  fieldErrors["End Date"] ? "border-rose-500 focus:border-rose-500" : ""
                )}
              />
            </FormField>
          </div>

          {formError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md disabled:opacity-60"
          >
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Budget"}
          </button>
        </form>
      </Modal>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Budgeted</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(totalBudgeted)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Budgets</p>
          <p className="text-3xl font-bold text-foreground">{aggregated.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Budget Records</p>
          <p className="text-3xl font-bold text-foreground">{aggregated.filter((a) => a.category).length}</p>
        </motion.div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {aggregated.map((item, idx) => {
          const spent = item.spent;
          const remaining = item.remaining;
          const rawPercentage = item.percentage;
          const isOver = rawPercentage > 100;
          const displayPct = Math.min(rawPercentage, 999);

          return (
            <motion.div key={item.category?.name ?? 'uncategorized'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} onClick={() => setViewCategoryId(item.category?.name ?? 'uncategorized')} className="rounded-xl border border-border p-6 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10 cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center text-primary shadow-sm border border-border group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                    {getCategoryIcon(item.category?.name) ? (
                      <img src={getCategoryIcon(item.category?.name)} alt="" className="w-14 h-14 object-contain" />
                    ) : (
                      <PieChart className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{item.category?.name || "Uncategorized"}</h3>
                    <span className={cn(
                      "inline-flex mt-1.5 px-2 py-0.5 rounded-md text-xs font-semibold uppercase",
                      item.status === "WITHIN_BUDGET" ? "bg-sky-500/20 text-sky-300" :
                      item.status === "OVER_BUDGET" ? "bg-rose-500/20 text-rose-300" :
                      "bg-muted text-slate-300"
                    )}>
                      {item.status?.replace("_", " ") || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aggregate progress */}
              <div className="mb-5">
                <div className="flex justify-between items-end mb-2">
                  <span className={cn("text-2xl font-bold tracking-tight", isOver ? "text-rose-400" : "text-sky-400")}>{formatCurrency(spent)}</span>
                  <span className="text-sm font-medium text-slate-400">of {formatCurrency(item.totalAmount)}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", isOver ? "bg-rose-500" : "bg-sky-500")} style={{ width: `${Math.min(displayPct, 100)}%` }} />
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className={cn("w-4 h-4", isOver ? "text-rose-400" : "text-sky-400")} />
                    {isOver ? `>${displayPct.toFixed(0)}% Used` : `${displayPct.toFixed(0)}% Used`}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full border border-border text-xs", isOver ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-slate-400 bg-slate-800/60")}>
                    {isOver ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} left`}
                  </span>
                </div>
              </div>

              {/* Budget count hint */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item.budgets.length} budget{item.budgets.length > 1 ? "s" : ""} period
                </span>
                <span className="text-xs text-sky-400 font-medium">Click to view details</span>
              </div>
            </motion.div>
          );
        })}
        {aggregated.length === 0 && (
          <EmptyState
            title="No budgets created yet"
            description="Set monthly spending limits per category to stay in control."
          />
        )}
      </div>

      <Modal
        isOpen={!!editBudget}
        onClose={() => { setEditBudget(null); setFormError(""); }}
        title="Edit Budget"
        description={editBudget?.category ? editBudget.category.name : "Uncategorized"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
            <CurrencyInput
              value={editAmount}
              onChange={(v: string) => { setEditAmount(v); setFormError(""); }}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Start Date</label>
            <DatePicker
              value={editStart}
              onChange={(val) => { setEditStart(val); setFormError(""); }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">End Date</label>
            <DatePicker
              value={editEnd}
              onChange={(val) => { setEditEnd(val); setFormError(""); }}
            />
          </div>
        </div>
        {formError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditBudget(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editAmount && editStart && editEnd && editBudget) updateMutation.mutate({ id: editBudget.id, amount: Number(editAmount), startDate: dateToApiISO(editStart), endDate: dateToApiISO(editEnd) }); }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(budgetToDelete) deleteMutation.mutate(budgetToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete budget?"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />

      <Modal
        isOpen={!!viewCategoryId}
        onClose={() => setViewCategoryId(null)}
        title={(() => {
          const agg = aggregated.find((a) => (a.category?.name ?? 'uncategorized') === viewCategoryId);
          return agg?.category?.name || "Uncategorized";
        })()}
        description="Budget breakdown"
      >
        {(() => {
          const agg = aggregated.find((a) => (a.category?.name ?? 'uncategorized') === viewCategoryId);
          if(!agg) return null;
          const isOver = agg.percentage > 100;
          const displayPct = Math.min(agg.percentage, 999);
          return (
            <div className="space-y-5">
              {/* Category summary */}
              <div className="rounded-xl border border-border bg-background p-5 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budgeted</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(agg.totalAmount)}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold uppercase",
                    agg.status === "WITHIN_BUDGET" ? "bg-sky-500/20 text-sky-300" :
                    agg.status === "OVER_BUDGET" ? "bg-rose-500/20 text-rose-300" :
                    "bg-muted text-slate-300"
                  )}>
                    {agg.status.replace("_", " ")}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", isOver ? "bg-rose-500" : "bg-sky-500")} style={{ width: `${Math.min(displayPct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className={cn("font-semibold", isOver ? "text-rose-400" : "text-sky-400")}>{formatCurrency(agg.spent)} spent</span>
                  <span className={cn(isOver ? "text-rose-400" : "text-slate-400")}>
                    {isOver ? `Over by ${formatCurrency(Math.abs(agg.remaining))}` : `${formatCurrency(agg.remaining)} left`}
                  </span>
                </div>
              </div>

              {/* Individual budgets */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Individual Budgets</p>
                {agg.budgets.map((b) => {
                  const bOver = b.percentage > 100;
                  const bDisplayPct = Math.min(b.percentage, 999);
                  return (
                    <div key={b.id} className="rounded-xl border border-border bg-background p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(b.amount)}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(b.startDate), "dd MMM yyyy")} - {format(new Date(b.endDate), "dd MMM yyyy")}</p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === b.id ? null : b.id); }}
                            className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeMenuId === b.id && (
                            <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => { const bud = budgets.find((x) => x.id === b.id); if(bud){ setEditBudget(bud); setEditAmount(String(bud.amount)); setEditStart(apiDateToInput(bud.startDate)); setEditEnd(apiDateToInput(bud.endDate)); setViewCategoryId(null); } setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-sky-500/[0.05] transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-sky-400" /> Edit
                              </button>
                              <button
                                onClick={() => { setBudgetToDelete(b.id); setShowDeleteConfirm(true); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-700", bOver ? "bg-rose-500" : "bg-sky-500")} style={{ width: `${Math.min(bDisplayPct, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={cn("font-medium", bOver ? "text-rose-400" : "text-sky-400")}>{formatCurrency(b.spent)} spent ({bDisplayPct}%)</span>
                        <span className={cn(bOver ? "text-rose-400" : "text-slate-400")}>
                          {bOver ? `Over ${formatCurrency(Math.abs(b.remaining))}` : `${formatCurrency(b.remaining)} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
