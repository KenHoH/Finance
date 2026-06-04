"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Edit2, Trash2, TrendingUp, Trophy, XCircle, Coins, Loader2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency, dateToApiISO, apiDateToInput, unwrapArray } from "@/lib/utils";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormField } from "@/components/ui/FormField";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Goal } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

export default function GoalsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contributeModal, setContributeModal] = useState<{ id: string; name: string } | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async() => {
      const res = await get<unknown>("/goals");
      return unwrapArray<Goal>(res);
    },
  });

  const totalTarget = goals.reduce((acc, curr) => acc + Number(curr.targetAmount), 0);
  const totalCurrent = goals.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; targetAmount: number; deadline?: string }) => api.post("/goals", dto),
    onMutate: async (dto) => {
      const temp: Goal = {
        id: `opt-${Date.now()}`,
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: 0,
        deadline: dto.deadline || null,
        status: "IN_PROGRESS",
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["goals"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["goals"], context);
      addToast(extractApiError(err, "Failed to create goal"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
    onSuccess: () => {
      setIsSuccess(true);
      setName("");
      setTargetAmount("");
      setDeadline("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
    },
  });

  const contributeMutation = useMutation({
    mutationFn: (dto: { id: string; amount: number }) =>
      api.post(`/goals/${dto.id}/contribute`, { amount: dto.amount }),
    onMutate: async (dto) => {
      const goal = goals.find((g) => g.id === dto.id);
      const current = Number(goal?.currentAmount || 0);
      return optimisticUpdate(queryClient, ["goals"], dto.id, { currentAmount: current + dto.amount });
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["goals"], context);
      addToast(extractApiError(err, "Failed to contribute"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
    onSuccess: () => {
      setContributeModal(null);
      setContributeAmount("");
      addToast("Contribution added", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; name: string; targetAmount: number; deadline?: string }) => {
      const { id, ...body } = dto;
      return api.put(`/goals/${id}`, body);
    },
    onMutate: async (dto) => optimisticUpdate(queryClient, ["goals"], dto.id, { name: dto.name, targetAmount: dto.targetAmount, deadline: dto.deadline }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["goals"], context);
      addToast(extractApiError(err, "Failed to update goal"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
    onSuccess: () => {
      setEditGoal(null);
      setEditName("");
      setEditTarget("");
      setEditDeadline("");
      addToast("Goal updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["goals"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["goals"], context);
      addToast(extractApiError(err, "Failed to delete goal"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
    onSuccess: () => {
      addToast("Goal deleted", "success");
    },
  });

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0,1,2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map((i) => (
            <Skeleton key={i} className="h-44" />
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
              <Target className="w-5 h-5 text-sky-400" />
            </div>
            Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track and achieve your savings targets</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> New Goal
        </button>
      </header>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Goal"
        description="Define a target amount and deadline."
        isSuccess={isSuccess}
        successMessage="Goal successfully created!"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateString(name, "Goal Name", { min: 1, max: 100 }),
              validateNumber(targetAmount, "Target Amount", { min: 0.01 }),
              validateString(deadline, "Deadline")
            );
            const mapped: Record<string, string> = {};
            errors.forEach((err) => { mapped[err.field] = err.message; });
            if(new Date(deadline) < new Date()){
              mapped["Deadline"] = "Deadline must be in the future";
            }
            setFieldErrors(mapped);
            if(Object.keys(mapped).length > 0) return;
            createMutation.mutate({
              name: name.trim(),
              targetAmount: Number(targetAmount),
              deadline,
            });
          }}
        >
          <FormField label="Goal Name" htmlFor="goal-name" error={fieldErrors["Goal Name"]}>
            <input
              id="goal-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n["Goal Name"]; return n; }); }}
              placeholder="e.g. Emergency Fund"
              className={cn(
                "w-full px-4 py-3 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all text-base font-medium",
                fieldErrors["Goal Name"] ? "border-rose-500 focus:border-rose-500" : "border-border focus:border-primary"
              )}
            />
          </FormField>

          <FormField label="Target Amount" htmlFor="goal-amount" error={fieldErrors["Target Amount"]}>
            <CurrencyInput
              id="goal-amount"
              value={targetAmount}
              onChange={(v: string) => { setTargetAmount(v); setFieldErrors((prev) => { const n = { ...prev }; delete n["Target Amount"]; return n; }); }}
              placeholder="0"
              className={cn(
                fieldErrors["Target Amount"] ? "[&_input]:border-rose-500 [&_input]:focus:border-rose-500" : ""
              )}
            />
          </FormField>

          <FormField label="Deadline" htmlFor="goal-deadline" error={fieldErrors["Deadline"]}>
            <DatePicker
              id="goal-deadline"
              value={deadline}
              onChange={(v) => { setDeadline(v); setFieldErrors((prev) => { const n = { ...prev }; delete n["Deadline"]; return n; }); }}
              className={cn(
                "[&_input]:border",
                fieldErrors["Deadline"] ? "[&_input]:border-rose-500 [&_input]:focus:border-rose-500" : "[&_input]:border-border [&_input]:focus:border-primary"
              )}
            />
          </FormField>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] mt-6 disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Goal"
            )}
          </button>
        </form>
      </Modal>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Target</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(totalTarget)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Saved So Far</p>
          <p className="text-3xl font-bold text-sky-400">{formatCurrency(totalCurrent)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Active Goals</p>
          <p className="text-3xl font-bold text-foreground">{goals.filter(g => g.status === "IN_PROGRESS").length}</p>
        </motion.div>
      </div>

      {/* Active Goals */}
      {goals.filter((g) => g.status !== "ACHIEVED").length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals
              .filter((g) => g.status !== "ACHIEVED")
              .map((goal, idx) => {
                const percentage = goal.targetAmount > 0 ? Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100) : 0;
                const statusIcon = goal.status === "CANCELLED" ? <XCircle className="w-4 h-4 text-rose-300" /> : <TrendingUp className="w-4 h-4 text-sky-300" />;
                const statusText = goal.status === "CANCELLED" ? "Cancelled" : "In Progress";
                const statusColor = goal.status === "CANCELLED" ? "text-rose-300 bg-rose-500/20 border-rose-500/30" : "text-sky-300 bg-sky-500/20 border-sky-500/30";

                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }} className="rounded-xl border border-border p-5 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{goal.deadline ? format(new Date(goal.deadline), "dd MMM yyyy") : "No deadline"}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === goal.id ? null : goal.id); }}
                          className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuId === goal.id && (
                          <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { setContributeModal({ id: goal.id, name: goal.name }); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-sky-500/[0.05] transition-colors"
                            >
                              <Coins className="w-4 h-4 text-sky-400" /> Contribute
                            </button>
                            <button
                              onClick={() => { setEditGoal(goal); setEditName(goal.name); setEditTarget(String(goal.targetAmount)); setEditDeadline(apiDateToInput(goal.deadline || "")); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-sky-500/[0.05] transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-sky-400" /> Edit
                            </button>
                            <button
                              onClick={() => { setGoalToDelete(goal.id); setShowDeleteConfirm(true); setActiveMenuId(null); }}
                              disabled={deleteMutation.isPending}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-lg font-bold tracking-tight text-sky-400">{formatCurrency(Number(goal.currentAmount))}</span>
                        <span className="text-sm font-medium text-slate-400">of {formatCurrency(Number(goal.targetAmount))}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-sky-500" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-base font-medium">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <TrendingUp className="w-4 h-4 text-sky-400" /> {percentage.toFixed(1)}%
                        </span>
                        <span className={cn("px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 text-sm", statusColor)}>
                          {statusIcon} {statusText}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* Achieved Goals */}
      {goals.filter((g) => g.status === "ACHIEVED").length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals
              .filter((g) => g.status === "ACHIEVED")
              .map((goal, idx) => {
                const percentage = goal.targetAmount > 0 ? Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100) : 0;
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }} className="rounded-xl border border-border p-5 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10 opacity-80">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{goal.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{goal.deadline ? format(new Date(goal.deadline), "dd MMM yyyy") : "No deadline"}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === goal.id ? null : goal.id); }}
                          className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuId === goal.id && (
                          <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { setGoalToDelete(goal.id); setShowDeleteConfirm(true); setActiveMenuId(null); }}
                              disabled={deleteMutation.isPending}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-lg font-bold tracking-tight text-emerald-400">{formatCurrency(Number(goal.currentAmount))}</span>
                        <span className="text-sm font-medium text-slate-400">of {formatCurrency(Number(goal.targetAmount))}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-emerald-500" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-base font-medium">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Trophy className="w-4 h-4 text-emerald-400" /> {percentage.toFixed(1)}%
                        </span>
                        <span className="px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 text-sm text-emerald-300 bg-emerald-500/20 border-emerald-500/30">
                          <Trophy className="w-4 h-4 text-emerald-300" /> Achieved
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}
      {goals.length === 0 && (
        <EmptyState
          title="No goals created yet"
          description="Create savings goals and track your progress visually."
        />
      )}

      <Modal
        isOpen={!!contributeModal}
        onClose={() => setContributeModal(null)}
        title="Contribute"
        description={contributeModal?.name}
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
          <CurrencyInput
            value={contributeAmount}
            onChange={setContributeAmount}
            placeholder="0"
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setContributeModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(contributeAmount && contributeModal) contributeMutation.mutate({ id: contributeModal.id, amount: Number(contributeAmount) }); }}
            disabled={contributeMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {contributeMutation.isPending ? "Saving..." : "Contribute"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!editGoal}
        onClose={() => setEditGoal(null)}
        title="Edit Goal"
        description={editGoal?.name}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Goal name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Target Amount</label>
            <CurrencyInput
              value={editTarget}
              onChange={setEditTarget}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Deadline</label>
            <DatePicker
              value={editDeadline}
              onChange={(val) => setEditDeadline(val)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditGoal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editName && editTarget && editGoal) updateMutation.mutate({ id: editGoal.id, name: editName, targetAmount: Number(editTarget), deadline: editDeadline ? dateToApiISO(editDeadline) : undefined }); }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(goalToDelete) deleteMutation.mutate(goalToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete goal?"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
