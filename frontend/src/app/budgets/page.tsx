"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Plus, Edit2, Trash2, CheckCircle2, Loader2 } from "lucide-react";
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

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const { data: budgetStatuses = {} } = useQuery<Record<string, { status: string; spent: number; remaining: number }>>({
    queryKey: ["budgets", "statuses"],
    queryFn: async() => {
      if(!budgets.length) return {};
      const results: Record<string, { status: string; spent: number; remaining: number }> = {};
      await Promise.all(
        budgets.map(async(b) => {
          try{
            const res = await get<{ status: string; spent: number; remaining: number }>(`/budgets/${b.id}/status`);
            results[b.id] = res;
          } catch{
            results[b.id] = { status: "UNKNOWN", spent: 0, remaining: Number(b.amount) };
          }
        })
      );
      return results;
    },
    enabled: budgets.length > 0,
  });

  const totalBudgeted = budgets.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { amount: number; startDate: string; endDate: string; categoryId?: string }) =>
      api.post("/budgets", dto),
    onMutate: async (dto) => {
      const temp: Budget = {
        id: `opt-${Date.now()}`,
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
      addToast(extractApiError(err, "Failed to create budget"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    onSuccess: () => {
      setIsSuccess(true);
      setCategoryId("");
      setAmount("");
      setStartDate("");
      setEndDate("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
      addToast("Budget created", "success");
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
      addToast(extractApiError(err, "Failed to update budget"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    onSuccess: () => {
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
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
        onClose={() => setIsModalOpen(false)}
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
              onChange={(e) => { setCategoryId(e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n["Category"]; return n; }); }}
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
              onChange={(v: string) => { setAmount(v); setFieldErrors((prev) => { const n = { ...prev }; delete n["Amount"]; return n; }); }}
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
                onChange={(val) => { setStartDate(val); setFieldErrors((prev) => { const n = { ...prev }; delete n["Start Date"]; return n; }); }}
                className={cn(
                  fieldErrors["Start Date"] ? "border-rose-500 focus:border-rose-500" : ""
                )}
              />
            </FormField>
            <FormField label="End Date" htmlFor="budget-end" error={fieldErrors["End Date"]}>
              <DatePicker
                id="budget-end"
                value={endDate}
                onChange={(val) => { setEndDate(val); setFieldErrors((prev) => { const n = { ...prev }; delete n["End Date"]; return n; }); }}
                className={cn(
                  fieldErrors["End Date"] ? "border-rose-500 focus:border-rose-500" : ""
                )}
              />
            </FormField>
          </div>

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
          <p className="text-3xl font-bold text-foreground">{budgets.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
          <p className="text-3xl font-bold text-foreground">{new Set(budgets.map((b) => b.category?.name).filter(Boolean)).size}</p>
        </motion.div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {budgets.map((budget, idx) => {
          const status = budgetStatuses[budget.id];
          const spent = status?.spent ?? 0;
          const remaining = status?.remaining ?? Number(budget.amount);
          const percentage = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;

          return (
            <motion.div key={budget.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="rounded-xl border border-border p-6 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center text-primary shadow-sm border border-border group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                    {getCategoryIcon(budget.category?.name) ? (
                      <img src={getCategoryIcon(budget.category?.name)} alt="" className="w-14 h-14 object-contain" />
                    ) : (
                      <PieChart className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{budget.category?.name || "Uncategorized"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(budget.startDate), "dd MMM")} - {format(new Date(budget.endDate), "dd MMM yyyy")}
                    </p>
                    {status && (
                      <span className={cn(
                        "inline-flex mt-1.5 px-2 py-0.5 rounded-md text-xs font-semibold uppercase",
                        status.status === "WITHIN_BUDGET" ? "bg-sky-500/20 text-sky-300" :
                        status.status === "OVER_BUDGET" ? "bg-rose-500/20 text-rose-300" :
                        "bg-muted text-slate-300"
                      )}>
                        {status.status?.replace("_", " ") || "Unknown"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditBudget(budget); setEditAmount(String(budget.amount)); setEditStart(apiDateToInput(budget.startDate)); setEditEnd(apiDateToInput(budget.endDate)); }}
                    className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                    aria-label="Edit budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setBudgetToDelete(budget.id); setShowDeleteConfirm(true); }}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    aria-label="Delete budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <span className={cn("text-3xl font-bold tracking-tight", percentage > 100 ? "text-rose-400" : "text-sky-400")}>{formatCurrency(spent)}</span>
                  <span className="text-sm font-medium text-slate-400">of {formatCurrency(Number(budget.amount))}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", percentage > 100 ? "bg-rose-500" : "bg-sky-500")} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <div className="flex justify-between items-center text-base font-medium">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className={cn("w-5 h-5", percentage > 100 ? "text-rose-400" : "text-sky-400")} /> {percentage.toFixed(0)}% Used
                  </span>
                  <span className="text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-border text-sm">
                    {formatCurrency(remaining)} left
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {budgets.length === 0 && (
          <EmptyState
            title="No budgets created yet"
            description="Set monthly spending limits per category to stay in control."
          />
        )}
      </div>

      <Modal
        isOpen={!!editBudget}
        onClose={() => setEditBudget(null)}
        title="Edit Budget"
        description={editBudget?.category ? editBudget.category.name : "Uncategorized"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
            <CurrencyInput
              value={editAmount}
              onChange={setEditAmount}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Start Date</label>
            <DatePicker
              value={editStart}
              onChange={(val) => setEditStart(val)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">End Date</label>
            <DatePicker
              value={editEnd}
              onChange={(val) => setEditEnd(val)}
            />
          </div>
        </div>
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
    </div>
  );
}
