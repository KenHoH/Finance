"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Edit2, ArrowUpRight, ArrowDownRight, Loader2, Search } from "lucide-react";
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
import { CATEGORY_LUCIDE_ICONS, getLucideIcon } from "@/lib/category-lucide-icons";

export default function CategoriesPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSuccess, setIsCreateSuccess] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [newIcon, setNewIcon] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "default" | "custom">("all");

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; type: "INCOME" | "EXPENSE"; icon?: string }) =>
      api.post("/categories", dto),
    onMutate: async (dto) => {
      const temp: Category = { id: `opt-${Date.now()}`, name: dto.name, type: dto.type, icon: dto.icon ?? null };
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
        setNewIcon("");
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
    mutationFn: (dto: { id: string; name: string; icon?: string | null }) =>
      api.put(`/categories/${dto.id}`, { name: dto.name, icon: dto.icon }),
    onMutate: async (dto) => optimisticUpdate(queryClient, ["categories"], dto.id, { name: dto.name, icon: dto.icon }),
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

  const filtered = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ? true :
      activeTab === "default" ? !c.userId :
      activeTab === "custom" ? !!c.userId : true;
    return matchesSearch && matchesTab;
  });

  const incomeCats = filtered.filter((c) => c.type === "INCOME");
  const expenseCats = filtered.filter((c) => c.type === "EXPENSE");

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

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {(["all", "default", "custom"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === tab
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab === "all" ? "All" : tab === "default" ? "Default" : "My Categories"}
            </button>
          ))}
        </div>
      </div>

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
                  const LucideIcon = getLucideIcon(cat.icon);
                  if(LucideIcon){
                    return (
                      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-primary">
                        <LucideIcon className="w-7 h-7" />
                      </div>
                    );
                  }
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
              {cat.userId && (
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
              )}
            </motion.div>
          ))}
          {expenseCats.length === 0 && (
            <div className="col-span-full flex flex-col items-center p-8 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground">
              <img src="/empty-transactions.png" alt="" className="w-40 h-40 mb-3 opacity-70" />
              <p className="font-medium">
                {searchQuery || activeTab !== "all" ? "No matching expense categories." : "No expense categories yet."}
              </p>
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
                  const LucideIcon = getLucideIcon(cat.icon);
                  if(LucideIcon){
                    return (
                      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-primary">
                        <LucideIcon className="w-7 h-7" />
                      </div>
                    );
                  }
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
              {cat.userId && (
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
              )}
            </motion.div>
          ))}
          {incomeCats.length === 0 && (
            <div className="col-span-full flex flex-col items-center p-8 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground">
              <img src="/empty-transactions.png" alt="" className="w-40 h-40 mb-3 opacity-70" />
              <p className="font-medium">
                {searchQuery || activeTab !== "all" ? "No matching income categories." : "No income categories yet."}
              </p>
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
            createMutation.mutate({ name: newName.trim(), type: newType, icon: newIcon || undefined });
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
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Icon</label>
            <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1">
              {CATEGORY_LUCIDE_ICONS.map((icon) => {
                const IconComp = icon.component;
                const isSelected = newIcon === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setNewIcon(icon.name)}
                    title={icon.label}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/50"
                    )}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
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
        description="Update the category name and icon."
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
            <input
              type="text"
              defaultValue={editCategory?.name}
              onChange={(e) => setEditCategory((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Icon</label>
            <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1">
              {CATEGORY_LUCIDE_ICONS.map((icon) => {
                const IconComp = icon.component;
                const isSelected = editCategory?.icon === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setEditCategory((prev) => prev ? { ...prev, icon: icon.name } : prev)}
                    title={icon.label}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/50"
                    )}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setEditCategory(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors">Cancel</button>
          <button
            onClick={() => { if(editCategory) updateMutation.mutate({ id: editCategory.id, name: editCategory.name, icon: editCategory.icon }); }}
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

