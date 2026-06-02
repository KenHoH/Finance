"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { PiggyBank, Plus, Edit2, Trash2, Target, Wallet, ArrowLeft, TrendingUp, Landmark, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { get, del, post, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SavingPoint, Goal, Category, DebtPoint, Budget } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

export default function SavingPointsPage(){
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSuccess, setIsCreateSuccess] = useState(false);
  const [budgetId, setBudgetId] = useState("");
  const [savingAmount, setSavingAmount] = useState("");
  const [allocateModal, setAllocateModal] = useState<{ id: string; amount: number } | null>(null);
  const [goalId, setGoalId] = useState("");
  const [allocateAmount, setAllocateAmount] = useState("");
  const [note, setNote] = useState("");
  const [allocateTab, setAllocateTab] = useState<"goal" | "investment" | "debt">("goal");
  const [investCategoryId, setInvestCategoryId] = useState("");
  const [debtPointId, setDebtPointId] = useState("");
  const [editPoint, setEditPoint] = useState<SavingPoint | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<string | null>(null);

  const { data: points = [], isLoading } = useQuery<SavingPoint[]>({
    queryKey: ["saving-points"],
    queryFn: async() => {
      const res = await get<unknown>("/saving-points");
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async() => {
      const res = await get<unknown>("/goals");
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async() => {
      const res = await get<unknown>("/categories");
      return Array.isArray(res) ? res.filter((c: Category) => c.type === "INVESTMENT") : [];
    },
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async() => {
      const res = await get<unknown>("/budgets");
      return Array.isArray(res) ? res : [];
    },
  });

  const { data: debtPoints = [] } = useQuery<DebtPoint[]>({
    queryKey: ["debt-points", budgets.map((b) => b.id)],
    queryFn: async() => {
      if(budgets.length === 0) return [];
      const res = await post<unknown>("/debt/budget-ids", budgets.map((b) => b.id));
      return Array.isArray(res) ? res : [];
    },
    enabled: budgets.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (dto: { budgetId: string; savingAmount: number }) => api.post("/saving-points", dto),
    onMutate: async (dto) => {
      const temp: SavingPoint = {
        id: `opt-${Date.now()}`,
        budgetId: dto.budgetId,
        savingAmount: dto.savingAmount,
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["saving-points"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["saving-points"], context);
      addToast(extractApiError(err, "Failed to create saving point"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saving-points"] }),
    onSuccess: () => {
      setIsCreateSuccess(true);
      setTimeout(() => {
        setIsCreateSuccess(false);
        setIsModalOpen(false);
        setBudgetId("");
        setSavingAmount("");
      }, 1500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/saving-points/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["saving-points"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["saving-points"], context);
      addToast(extractApiError(err, "Failed to delete saving point"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saving-points"] }),
    onSuccess: () => {
      addToast("Saving point deleted", "success");
    },
  });

  const allocateGoalMutation = useMutation({
    mutationFn: (dto: { id: string; goalId: string; amount: number; note?: string }) =>
      api.post(`/saving-points/${dto.id}/allocate-to-goal`, { goalId: dto.goalId, amount: dto.amount, note: dto.note }),
    onMutate: async (dto) => {
      const point = points.find((p) => p.id === dto.id);
      const prevAmount = Number(point?.savingAmount || 0);
      await optimisticUpdate(queryClient, ["saving-points"], dto.id, { savingAmount: Math.max(0, prevAmount - dto.amount) });
      const goal = goals.find((g) => g.id === dto.goalId);
      const prevCurrent = Number(goal?.currentAmount || 0);
      await optimisticUpdate(queryClient, ["goals"], dto.goalId, { currentAmount: prevCurrent + dto.amount });
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["saving-points"], undefined);
      rollbackOnError(queryClient, ["goals"], undefined);
      addToast(extractApiError(err, "Failed to allocate"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-points"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onSuccess: () => {
      setAllocateModal(null);
      setGoalId("");
      setAllocateAmount("");
      setNote("");
      setAllocateTab("goal");
      addToast("Allocated to goal", "success");
    },
  });

  const allocateInvestmentMutation = useMutation({
    mutationFn: (dto: { id: string; categoryId: string; amount: number; note?: string }) =>
      api.post(`/saving-points/${dto.id}/allocate-to-investment`, { categoryId: dto.categoryId, amount: dto.amount, note: dto.note }),
    onError: (err) => {
      addToast(extractApiError(err, "Failed to allocate to investment"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-points"] });
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    },
    onSuccess: () => {
      setAllocateModal(null);
      setInvestCategoryId("");
      setAllocateAmount("");
      setNote("");
      setAllocateTab("goal");
      addToast("Allocated to investment", "success");
    },
  });

  const payDebtMutation = useMutation({
    mutationFn: (dto: { id: string; debtPointId: string; amount: number; note?: string }) =>
      api.post(`/saving-points/${dto.id}/pay-debt`, { debtPointId: dto.debtPointId, amount: dto.amount, note: dto.note }),
    onError: (err) => {
      addToast(extractApiError(err, "Failed to pay debt"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-points"] });
      queryClient.invalidateQueries({ queryKey: ["debt-points"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
    onSuccess: () => {
      setAllocateModal(null);
      setDebtPointId("");
      setAllocateAmount("");
      setNote("");
      setAllocateTab("goal");
      addToast("Debt paid", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; savingAmount: number }) =>
      api.put(`/saving-points/${dto.id}`, { savingAmount: dto.savingAmount }),
    onMutate: async (dto) => optimisticUpdate(queryClient, ["saving-points"], dto.id, { savingAmount: dto.savingAmount }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["saving-points"], context);
      addToast(extractApiError(err, "Failed to update saving point"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saving-points"] }),
    onSuccess: () => {
      setEditPoint(null);
      setEditAmount("");
      addToast("Saving point updated", "success");
    },
  });

  const totalSaved = points.reduce((sum, p) => sum + Number(p.savingAmount), 0);

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <PiggyBank className="w-5 h-5 text-sky-400" />
            </div>
            Saving Points
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track savings from your budgets</p>
          <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-sky-400 transition-colors mt-2">
            <ArrowLeft className="w-3 h-3" /> Back to Settings
          </Link>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> Create Point
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-7">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Saved</p>
          <p className="text-3xl font-bold text-sky-400">{formatCurrency(totalSaved)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7">
          <p className="text-sm font-medium text-muted-foreground mb-1">Active Points</p>
          <p className="text-3xl font-bold text-foreground">{points.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-7">
          <p className="text-sm font-medium text-muted-foreground mb-1">Available Goals</p>
          <p className="text-3xl font-bold text-foreground">{goals.length}</p>
        </motion.div>
      </div>

      {/* Points List */}
      <div className="space-y-3">
        {points.map((point, i) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-sky-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {point.budget?.category?.name || "Budget"} — {formatCurrency(Number(point.savingAmount))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(point.createdAt), "dd MMM yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setAllocateModal({ id: point.id, amount: Number(point.savingAmount) })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Target className="w-3.5 h-3.5" /> Allocate
              </button>
              <button
                onClick={() => { setEditPoint(point); setEditAmount(String(point.savingAmount)); }}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                aria-label="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setPointToDelete(point.id); setShowDeleteConfirm(true); }}
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
        {points.length === 0 && (
          <EmptyState
            image="/empty-savingpoints.png"
            title="No saving points yet"
            description="Create a saving point from your budget surplus."
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsCreateSuccess(false); setIsModalOpen(false); }}
        title="Create Saving Point"
        description="Link a budget and set a saving amount."
        isSuccess={isCreateSuccess}
        successMessage="Saving point successfully created!"
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Budget ID</label>
            <input type="text" value={budgetId} onChange={(e) => setBudgetId(e.target.value)} placeholder="Budget UUID" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Saving Amount</label>
            <CurrencyInput value={savingAmount} onChange={setSavingAmount} placeholder="0" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button onClick={() => {
            const errors = runValidators(
              validateString(budgetId, "Budget", { min: 1 }),
              validateNumber(savingAmount, "Saving Amount", { min: 0.01 })
            );
            if(errors.length > 0){
              addToast(errors[0].message, "error");
              return;
            }
            createMutation.mutate({ budgetId, savingAmount: Number(savingAmount) });
          }} disabled={createMutation.isPending} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">Save</button>
        </div>
      </Modal>

      <Modal
        isOpen={!!allocateModal}
        onClose={() => setAllocateModal(null)}
        title="Allocate Surplus"
        description={allocateModal ? `Available: ${formatCurrency(allocateModal.amount)}` : ""}
      >
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1 mb-4">
          {(["goal", "investment", "debt"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAllocateTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                allocateTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "goal" && <Target className="w-3.5 h-3.5" />}
              {tab === "investment" && <TrendingUp className="w-3.5 h-3.5" />}
              {tab === "debt" && <Landmark className="w-3.5 h-3.5" />}
              {tab === "goal" ? "Goal" : tab === "investment" ? "Investment" : "Pay Debt"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {allocateTab === "goal" && (
            <div>
              <label htmlFor="goal-select" className="text-sm font-medium text-foreground mb-1 block">Goal</label>
              <select id="goal-select" value={goalId} onChange={(e) => setGoalId(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">Select goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({formatCurrency(Number(g.currentAmount))} / {formatCurrency(Number(g.targetAmount))})</option>
                ))}
              </select>
            </div>
          )}

          {allocateTab === "investment" && (
            <div>
              <label htmlFor="invest-select" className="text-sm font-medium text-foreground mb-1 block">Investment Category</label>
              <select id="invest-select" value={investCategoryId} onChange={(e) => setInvestCategoryId(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {allocateTab === "debt" && (
            <div>
              <label htmlFor="debt-select" className="text-sm font-medium text-foreground mb-1 block">Debt to Pay</label>
              <select id="debt-select" value={debtPointId} onChange={(e) => setDebtPointId(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">Select debt</option>
                {debtPoints.map((d) => (
                  <option key={d.id} value={d.id}>{d.budget?.category?.name || "Budget"} — {formatCurrency(Number(d.debtAmount))}</option>
                ))}
              </select>
              {debtPoints.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> No debts available
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="allocate-amount" className="text-sm font-medium text-foreground mb-1 block">Amount</label>
            <CurrencyInput id="allocate-amount" value={allocateAmount} onChange={setAllocateAmount} placeholder="0" />
          </div>
          <div>
            <label htmlFor="allocate-note" className="text-sm font-medium text-foreground mb-1 block">Note (optional)</label>
            <input id="allocate-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Budget surplus allocation" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setAllocateModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button onClick={() => {
            const errors = runValidators(
              validateNumber(allocateAmount, "Amount", { min: 0.01 })
            );
            if(errors.length > 0){
              addToast(errors[0].message, "error");
              return;
            }
            if(allocateModal && Number(allocateAmount) > allocateModal.amount){
              addToast("Allocation cannot exceed available amount", "error");
              return;
            }
            if(!allocateModal) return;
            const dto = { id: allocateModal.id, amount: Number(allocateAmount), note: note || undefined };
            if(allocateTab === "goal"){
              if(!goalId){ addToast("Select a goal", "error"); return; }
              allocateGoalMutation.mutate({ ...dto, goalId });
            } else if(allocateTab === "investment"){
              if(!investCategoryId){ addToast("Select an investment category", "error"); return; }
              allocateInvestmentMutation.mutate({ ...dto, categoryId: investCategoryId });
            } else if(allocateTab === "debt"){
              if(!debtPointId){ addToast("Select a debt", "error"); return; }
              payDebtMutation.mutate({ ...dto, debtPointId });
            }
          }} disabled={allocateGoalMutation.isPending || allocateInvestmentMutation.isPending || payDebtMutation.isPending} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">Allocate</button>
        </div>
      </Modal>

      <Modal
        isOpen={!!editPoint}
        onClose={() => setEditPoint(null)}
        title="Edit Saving Point"
        description={editPoint?.budget?.category?.name || "Budget"}
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Saving Amount</label>
          <CurrencyInput
            value={editAmount}
            onChange={setEditAmount}
            placeholder="0"
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditPoint(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => {
              const err = validateNumber(editAmount, "Saving Amount", { min: 0.01 });
              if(err){
                addToast(err.message, "error");
                return;
              }
              if(editPoint) updateMutation.mutate({ id: editPoint.id, savingAmount: Number(editAmount) });
            }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(pointToDelete) deleteMutation.mutate(pointToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete saving point?"
        description="Are you sure you want to delete this saving point? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
