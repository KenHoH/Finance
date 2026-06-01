"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, TrendingDown, Edit2, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Budget, DebtPoint } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

export default function DebtsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [budgetId, setBudgetId] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [editDebt, setEditDebt] = useState<DebtPoint | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const { data: debts = [], isLoading } = useQuery<DebtPoint[]>({
    queryKey: ["debts", budgets.map((b) => b.id)],
    queryFn: async () => {
      if(budgets.length === 0) return [];
      return post<DebtPoint[]>("/debt/budget-ids", budgets.map((b) => b.id));
    },
    enabled: budgets.length > 0,
  });

  const totalDebt = debts.reduce((acc, curr) => acc + Number(curr.debtAmount), 0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { budgetId: string; debtAmount: number }) => api.post("/debts", dto),
    onMutate: async (dto) => {
      const temp: DebtPoint = {
        id: `opt-${Date.now()}`,
        budgetId: dto.budgetId,
        debtAmount: dto.debtAmount,
        budget: budgets.find((b) => b.id === dto.budgetId)
          ? {
              id: dto.budgetId,
              categoryId: budgets.find((b) => b.id === dto.budgetId)?.categoryId ?? null,
              category: budgets.find((b) => b.id === dto.budgetId)?.category ?? null,
              amount: Number(budgets.find((b) => b.id === dto.budgetId)?.amount || 0),
            }
          : undefined,
      };
      return optimisticCreate(queryClient, ["debts", budgets.map((b) => b.id)], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["debts", budgets.map((b) => b.id)], context);
      addToast(extractApiError(err, "Failed to record debt point"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["debts"] }),
    onSuccess: () => {
      setIsSuccess(true);
      setBudgetId("");
      setDebtAmount("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
      addToast("Debt point recorded", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; debtAmount: number }) =>
      api.put(`/debt/update/${dto.id}`, { debtAmount: dto.debtAmount }),
    onMutate: async (dto) => optimisticUpdate(queryClient, ["debts", budgets.map((b) => b.id)], dto.id, { debtAmount: dto.debtAmount }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["debts", budgets.map((b) => b.id)], context);
      addToast(extractApiError(err, "Failed to update debt"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["debts"] }),
    onSuccess: () => {
      setEditDebt(null);
      setEditAmount("");
      addToast("Debt updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/debt/delete/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["debts", budgets.map((b) => b.id)], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["debts", budgets.map((b) => b.id)], context);
      addToast(extractApiError(err, "Failed to delete debt"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["debts"] }),
    onSuccess: () => {
      addToast("Debt deleted", "success");
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
        <div className="space-y-4">
          {[0,1,2,3].map((i) => (
            <Skeleton key={i} className="h-20" />
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
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            Debts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track overspent budgets and debt points</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> Record Debt
        </button>
      </header>

      {/* Create Debt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Debt Point"
        description="Log an overspend against a budget."
        isSuccess={isSuccess}
        successMessage="Debt point recorded successfully!"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateString(budgetId, "Budget", { min: 1 }),
              validateNumber(debtAmount, "Debt Amount", { min: 0.01 })
            );
            if(errors.length > 0){
              addToast(errors[0].message, "error");
              return;
            }
            createMutation.mutate({ budgetId, debtAmount: Number(debtAmount) });
          }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Budget</label>
            <select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base font-medium"
            >
              <option value="">Select budget</option>
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>{b.category?.name || "Uncategorized"}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">Debt Amount</label>
            <CurrencyInput
              value={debtAmount}
              onChange={setDebtAmount}
              placeholder="0"
              required
              className="[&_input]:px-4 [&_input]:py-3 [&_input]:text-base [&_input]:font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] mt-6 shadow-md disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Debt Point"
            )}
          </button>
        </form>
      </Modal>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Overbudget</p>
          <p className="text-3xl font-bold text-rose-400">{formatCurrency(totalDebt)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Overspent Budgets</p>
          <p className="text-3xl font-bold text-foreground">{debts.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Active Budgets</p>
          <p className="text-3xl font-bold text-foreground">{budgets.length}</p>
        </motion.div>
      </div>

      {/* Debt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {debts.map((debt, idx) => (
          <motion.div key={debt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="rounded-xl border border-border p-6 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">{debt.budget?.category?.name || "Uncategorized"}</h3>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Overbudget</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditDebt(debt); setEditAmount(String(debt.debtAmount)); }}
                  className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                  aria-label="Edit debt"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setDebtToDelete(debt.id); setShowDeleteConfirm(true); }}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Delete debt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-3xl font-black tracking-tight text-rose-500">{formatCurrency(Number(debt.debtAmount))}</p>
              <div className="flex items-center gap-1 text-sm font-extrabold text-rose-500 mt-2">
                <AlertTriangle className="w-5 h-5" /> Overspent
              </div>
            </div>
          </motion.div>
        ))}
        {debts.length === 0 && (
          <EmptyState
            image="/empty-debts.png"
            title="No overspent budgets"
            description="You are on track! Debt points will appear here when budgets are exceeded."
          />
        )}
      </div>

      <Modal
        isOpen={!!editDebt}
        onClose={() => setEditDebt(null)}
        title="Edit Debt"
        description={editDebt?.budget?.category?.name || "Uncategorized"}
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Debt Amount</label>
          <CurrencyInput
            value={editAmount}
            onChange={setEditAmount}
            placeholder="0"
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditDebt(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editAmount && editDebt) updateMutation.mutate({ id: editDebt.id, debtAmount: Number(editAmount) }); }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(debtToDelete) deleteMutation.mutate(debtToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete debt?"
        description="Are you sure you want to delete this debt? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
