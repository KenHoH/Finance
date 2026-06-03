"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Edit2, ArrowUpRight, ArrowDownRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Category } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";
import { getCategoryIcon } from "@/lib/category-icons";

export default function CategoriesPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSuccess, setIsCreateSuccess] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; type: "INCOME" | "EXPENSE" }) =>
      api.post("/categories", dto),
    onMutate: async (dto) => {
      const temp: Category = { id: `opt-${Date.now()}`, name: dto.name, type: dto.type };
      return optimisticCreate(queryClient, ["categories"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["categories"], context);
      addToast(extractApiError(err, "Failed to create category"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onSuccess: () => {
      setIsCreateSuccess(true);
      setTimeout(() => {
        setIsCreateSuccess(false);
        setIsModalOpen(false);
        setNewName("");
      }, 1500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["categories"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["categories"], context);
      addToast(extractApiError(err, "Failed to delete category"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onSuccess: () => {
      addToast("Category deleted", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; name: string }) =>
      api.put(`/categories/${dto.id}`, { name: dto.name }),
    onMutate: async (dto) => optimisticUpdate(queryClient, ["categories"], dto.id, { name: dto.name }),
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["categories"], context);
      addToast(extractApiError(err, "Failed to update category"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onSuccess: () => {
      setEditCategory(null);
      addToast("Category updated", "success");
    },
  });

  const incomeCats = categories.filter((c) => c.type === "INCOME");
  const expenseCats = categories.filter((c) => c.type === "EXPENSE");

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[0,1,2,3,4,5].map((i) => (
            <Skeleton key={i} className="h-16" />
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
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Organize your transactions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> New Category
        </button>
      </header>

      {/* Expense Categories */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ArrowDownRight className="w-5 h-5 text-rose-400" /> Expense Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {expenseCats.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border p-5 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {(() => {
                  const icon = getCategoryIcon(cat.name);
                  if(icon){
                    return (
                      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center overflow-hidden">
                        <img src={icon} alt="" className="w-11 h-11 object-contain" />
                      </div>
                    );
                  }
                  return (
                    <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-muted-foreground font-bold text-sm">
                      {cat.name.slice(0, 2).toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <p className="font-bold text-foreground">{cat.name}</p>
                  <p className="text-sm text-muted-foreground font-medium">Expense</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditCategory(cat)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Edit category"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setCategoryToDelete(cat.id); setShowDeleteConfirm(true); }}
                  className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
          {expenseCats.length === 0 && (
            <div className="col-span-full flex flex-col items-center p-8 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground">
              <img src="/empty-transactions.png" alt="" className="w-40 h-40 mb-3 opacity-70" />
              <p className="font-medium">No expense categories yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Income Categories */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-sky-400" /> Income Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {incomeCats.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border p-5 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {(() => {
                  const icon = getCategoryIcon(cat.name);
                  if(icon){
                    return (
                      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center overflow-hidden">
                        <img src={icon} alt="" className="w-11 h-11 object-contain" />
                      </div>
                    );
                  }
                  return (
                    <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-muted-foreground font-bold text-sm">
                      {cat.name.slice(0, 2).toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <p className="font-bold text-foreground">{cat.name}</p>
                  <p className="text-sm text-muted-foreground font-medium">Income</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditCategory(cat)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Edit category"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setCategoryToDelete(cat.id); setShowDeleteConfirm(true); }}
                  className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
          {incomeCats.length === 0 && (
            <div className="col-span-full flex flex-col items-center p-8 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground">
              <img src="/empty-transactions.png" alt="" className="w-40 h-40 mb-3 opacity-70" />
              <p className="font-medium">No income categories yet.</p>
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsCreateSuccess(false); setIsModalOpen(false); }}
        title="New Category"
        description="Create a custom category for your transactions."
        isSuccess={isCreateSuccess}
        successMessage="Category successfully created!"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const errors = runValidators(
              validateString(newName, "Category Name", { min: 1, max: 50 })
            );
            if(errors.length > 0){
              addToast(errors[0].message, "error");
              return;
            }
            createMutation.mutate({ name: newName.trim(), type: newType });
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Groceries"
              required
              className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-lg font-medium placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Type</label>
            <div className="flex gap-2">
              {(["INCOME", "EXPENSE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                    newType === t
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/50"
                  )}
                >
                  {t === "INCOME" ? (
                    <span className="flex items-center justify-center gap-2"><ArrowUpRight className="w-5 h-5" /> Income</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><ArrowDownRight className="w-5 h-5" /> Expense</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Category"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={!!editCategory}
        onClose={() => setEditCategory(null)}
        title="Edit Category"
        description="Update the category name."
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
          <input
            type="text"
            defaultValue={editCategory?.name}
            onChange={(e) => setEditCategory((prev) => prev ? { ...prev, name: e.target.value } : prev)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditCategory(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editCategory) updateMutation.mutate({ id: editCategory.id, name: editCategory.name }); }}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(categoryToDelete) deleteMutation.mutate(categoryToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}

