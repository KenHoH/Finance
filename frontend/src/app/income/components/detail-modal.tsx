import type { Category, Transaction } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToastStore } from "@/store/useToastStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  optimisticUpdate,
  optimisticDelete,
  rollbackOnError,
} from "@/lib/optimistic";
import { del, put, extractApiError } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { formatCurrency, dateToApiISO, apiDateToInput } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { validateNumber } from "@/lib/validation";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function TransactionDetailModal({
  selectedTx,
  onClose,
  onDelete,
  categories,
  queryClient,
}: {
  selectedTx: Transaction | null;
  onClose: () => void;
  onDelete: () => void;
  categories: Category[];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const addToast = useToastStore((s) => s.addToast);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/transactions/${id}`),
    onMutate: async (id) => {
      await optimisticDelete(queryClient, ["transactions", "INCOME"], id);
      await optimisticDelete(queryClient, ["transactions"], id);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "INCOME"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to delete"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onDelete();
      onClose();
    },
    onSuccess: () => {
      addToast("Transaction deleted", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: {
      id: string;
      description: string;
      amount: number;
      date?: string;
      categoryId?: string;
    }) =>
      put(`/transactions/${dto.id}`, {
        description: dto.description,
        amount: dto.amount,
        date: dto.date,
        categoryId: dto.categoryId,
      }),
    onMutate: async (dto) => {
      const patch = {
        description: dto.description,
        amount: dto.amount,
        date: dto.date,
        categoryId: dto.categoryId,
      };
      await optimisticUpdate(
        queryClient,
        ["transactions", "INCOME"],
        dto.id,
        patch,
      );
      await optimisticUpdate(queryClient, ["transactions"], dto.id, patch);
      return {};
    },
    onError: (err) => {
      rollbackOnError(queryClient, ["transactions", "INCOME"], undefined);
      rollbackOnError(queryClient, ["transactions"], undefined);
      addToast(extractApiError(err, "Failed to update"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onDelete();
      setIsEditing(false);
    },
    onSuccess: () => {
      onClose();
      addToast("Transaction updated", "success");
    },
  });

  if (!selectedTx) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-card rounded-xl shadow-2xl z-50 p-7 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-2 hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditDesc(selectedTx.description || "");
                        setEditAmount(String(selectedTx.amount));
                        setEditDate(apiDateToInput(selectedTx.date));
                        setEditCategoryId(selectedTx.categoryId || "");
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-sky-500/[0.05] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-sky-400" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setMenuOpen(false);
                      }}
                      disabled={deleteMutation.isPending}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-sky-500/[0.05] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Amount
              </label>
              <CurrencyInput value={editAmount} onChange={setEditAmount} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Date
              </label>
              <DatePicker
                value={editDate}
                onChange={(val) => setEditDate(val)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Category
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const err = validateNumber(editAmount, "Amount", {
                    min: 0.01,
                  });
                  if (err) {
                    addToast(err.message, "error");
                    return;
                  }
                  updateMutation.mutate({
                    id: selectedTx.id,
                    description: editDesc.trim(),
                    amount: Number(editAmount),
                    date: editDate ? dateToApiISO(editDate) : undefined,
                    categoryId: editCategoryId || undefined,
                  });
                }}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-sky-400 mb-2">
                +{formatCurrency(Number(selectedTx.amount))}
              </h3>
              <p className="text-xl font-bold">
                {selectedTx.description || "-"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(selectedTx.date), "dd MMMM yyyy, HH:mm")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-background p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1 uppercase font-bold">
                  Category
                </p>
                <p className="font-bold">
                  {selectedTx.category?.name || "Uncategorized"}
                </p>
              </div>
              <div className="bg-background p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1 uppercase font-bold">
                  Source
                </p>
                <p className="font-bold capitalize">
                  {selectedTx.source || "Manual"}
                </p>
              </div>
            </div>
          </>
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onConfirm={() => {
            if (selectedTx) deleteMutation.mutate(selectedTx.id);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          title="Delete transaction?"
          description={`Are you sure you want to delete ${selectedTx?.description || "this transaction"}? This action cannot be undone.`}
          confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
          variant="danger"
        />
      </motion.div>
    </AnimatePresence>
  );
}