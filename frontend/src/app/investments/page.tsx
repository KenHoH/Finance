"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Edit2, Trash2, ArrowUpRight, PiggyBank, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn, formatCurrency } from "@/lib/utils";
import { validateString, validateNumber, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormField } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Category, Investment, Allocation } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

function getInvestmentImage(name: string){
  const n = name.toLowerCase();
  if(n.includes("stock")) return "/invest-stocks.png";
  if(n.includes("crypto")) return "/invest-crypto.png";
  if(n.includes("bond")) return "/invest-bonds.png";
  if(n.includes("real estate") || n.includes("property") || n.includes("realestate")) return "/invest-realestate.png";
  return "/invest-stocks.png";
}

export default function InvestmentsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: investments = [], isLoading: invLoading } = useQuery<Investment[]>({
    queryKey: ["investments"],
    queryFn: () => get<Investment[]>("/investments"),
  });

  const { data: allocations = [], isLoading: allocLoading } = useQuery<Allocation[]>({
    queryKey: ["investments", "allocations"],
    queryFn: () => get<Allocation[]>("/investments/allocations"),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const isLoading = invLoading || allocLoading;

  const totalValue = investments.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
  const totalAllocated = allocations.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const createMutation = useMutation({
    mutationFn: (dto: { categoryId: string; totalAmount: number }) => api.post("/investments", dto),
    onMutate: async (dto) => {
      const temp: Investment = {
        id: `opt-${Date.now()}`,
        totalAmount: dto.totalAmount,
        categoryId: dto.categoryId,
        category: categories.find((c) => c.id === dto.categoryId) || { id: dto.categoryId, name: "Investment" },
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["investments"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["investments"], context);
      addToast(extractApiError(err, "Failed to add investment"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["investments"] }),
    onSuccess: () => {
      setIsSuccess(true);
      setCategoryId("");
      setTotalAmount("");
      timeoutRef.current = setTimeout(() => {
        setIsSuccess(false);
        setIsModalOpen(false);
      }, 1500);
      addToast("Investment added", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; totalAmount: number }) =>
      api.put(`/investments/${dto.id}`, { totalAmount: dto.totalAmount }),
    onMutate: async (dto) => optimisticUpdate(queryClient, ["investments"], dto.id, { totalAmount: dto.totalAmount }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["investments"], context);
      addToast(extractApiError(err, "Failed to update investment"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["investments"] }),
    onSuccess: () => {
      setEditInvestment(null);
      setEditAmount("");
      addToast("Investment updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/investments/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["investments"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["investments"], context);
      addToast(extractApiError(err, "Failed to delete investment"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["investments"] }),
    onSuccess: () => {
      addToast("Investment deleted", "success");
    },
  });

  if(isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {[0,1,2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
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
              <TrendingUp className="w-5 h-5 text-sky-400" />
            </div>
            Investments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your portfolio and allocations</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> Add Investment
        </button>
      </header>

      {/* Create Investment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Investment"
        description="Track a new investment category."
        isSuccess={isSuccess}
        successMessage="Investment added successfully!"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateString(categoryId, "Category", { min: 1 }),
              validateNumber(totalAmount, "Total Value", { min: 0.01 })
            );
            const mapped: Record<string, string> = {};
            errors.forEach((err) => { mapped[err.field] = err.message; });
            setFieldErrors(mapped);
            if(Object.keys(mapped).length > 0) return;
            createMutation.mutate({
              categoryId,
              totalAmount: Number(totalAmount),
            });
          }}
        >
          <FormField label="Category" htmlFor="inv-category" error={fieldErrors["Category"]}>
            <select
              id="inv-category"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n["Category"]; return n; }); }}
              className={cn(
                "w-full px-4 py-3 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all text-base font-medium",
                fieldErrors["Category"] ? "border-rose-500 focus:border-rose-500" : "border-border focus:border-primary"
              )}
            >
              <option value="">Select a category</option>
              {categories.filter((c) => c.type === "INVESTMENT").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Total Value" htmlFor="inv-amount" error={fieldErrors["Total Value"]}>
            <CurrencyInput
              id="inv-amount"
              value={totalAmount}
              onChange={(v: string) => { setTotalAmount(v); setFieldErrors((prev) => { const n = { ...prev }; delete n["Total Value"]; return n; }); }}
              placeholder="0"
              className={cn(
                fieldErrors["Total Value"] ? "[&_input]:border-rose-500 [&_input]:focus:border-rose-500" : ""
              )}
            />
          </FormField>

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
              "Save Investment"
            )}
          </button>
        </form>
      </Modal>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Portfolio Value</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Allocated</p>
          <p className="text-3xl font-bold text-sky-400">{formatCurrency(totalAllocated)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-9">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</p>
          <p className="text-3xl font-bold text-foreground">{investments.length}</p>
        </motion.div>
      </div>

      {/* Investments Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {investments.map((inv, idx) => (
          <motion.div key={inv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="rounded-xl border border-border p-6 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center text-primary shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
                  <img src={getInvestmentImage(inv.category.name)} alt="" className="w-14 h-14 object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">{inv.category.name}</h3>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Investment</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditInvestment(inv); setEditAmount(String(inv.totalAmount)); }}
                  className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                  aria-label="Edit investment"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setInvestmentToDelete(inv.id); setShowDeleteConfirm(true); }}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Delete investment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-3xl font-black tracking-tight text-foreground">{formatCurrency(Number(inv.totalAmount))}</p>
              <div className="flex items-center gap-1 text-sm font-extrabold text-sky-400 mt-2">
                <ArrowUpRight className="w-5 h-5" /> Active
              </div>
            </div>
          </motion.div>
        ))}
        {investments.length === 0 && (
          <EmptyState
            title="No investments tracked yet"
            description="Start tracking your portfolio by adding your first investment category."
          />
        )}
      </div>

      {/* Allocations Table */}
      {allocations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2"><PiggyBank className="w-6 h-6 text-sky-400" /> Recent Allocations</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-7 py-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="px-7 py-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-7 py-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-7 py-5 font-bold text-foreground">{alloc.category.name}</td>
                    <td className="px-7 py-5 font-bold text-sky-400">{formatCurrency(Number(alloc.amount))}</td>
                    <td className="px-7 py-5 text-muted-foreground font-medium">{new Date(alloc.allocationDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!editInvestment}
        onClose={() => setEditInvestment(null)}
        title="Edit Investment"
        description={editInvestment?.category?.name}
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Total Amount</label>
          <CurrencyInput
            value={editAmount}
            onChange={setEditAmount}
            placeholder="0"
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditInvestment(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editAmount && editInvestment) updateMutation.mutate({ id: editInvestment.id, totalAmount: Number(editAmount) }); }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(investmentToDelete) deleteMutation.mutate(investmentToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete investment?"
        description="Are you sure you want to delete this investment? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
