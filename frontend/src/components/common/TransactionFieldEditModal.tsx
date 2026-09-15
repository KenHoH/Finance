"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import { extractApiError, put } from "@/lib/api";
import type { Category, Transaction } from "@/lib/types";
import { apiDateToInput, cn, dateToApiISO } from "@/lib/utils";
import { validateNumber } from "@/lib/validation";
import { useToastStore } from "@/store/useToastStore";

export type EditableTransactionField =
  | "date"
  | "description"
  | "categoryId"
  | "amount";

interface TransactionFieldEditModalProps {
  transaction: Transaction | null;
  field: EditableTransactionField | null;
  categories: Category[];
  onClose: () => void;
}

interface TransactionFieldUpdate {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string | null;
}

const FIELD_LABELS: Record<EditableTransactionField, string> = {
  date: "Date",
  description: "Description",
  categoryId: "Category",
  amount: "Amount",
};

function getInitialValue(
  transaction: Transaction,
  field: EditableTransactionField,
) {
  switch (field) {
    case "date":
      return apiDateToInput(transaction.date);
    case "description":
      return transaction.description || "";
    case "categoryId":
      return transaction.categoryId || "";
    case "amount":
      return String(transaction.amount);
  }
}

export function TransactionFieldEditModal({
  transaction,
  field,
  categories,
  onClose,
}: TransactionFieldEditModalProps) {
  if (!transaction || !field) return null;

  return (
    <TransactionFieldEditForm
      key={`${transaction.id}-${field}`}
      transaction={transaction}
      field={field}
      categories={categories}
      onClose={onClose}
    />
  );
}

function TransactionFieldEditForm({
  transaction,
  field,
  categories,
  onClose,
}: {
  transaction: Transaction;
  field: EditableTransactionField;
  categories: Category[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [value, setValue] = useState(() => getInitialValue(transaction, field));

  const updateMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: TransactionFieldUpdate }) =>
      put<Transaction>(`/transactions/${id}`, update),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      addToast("Transaction updated", "success");
      onClose();
    },
    onError: (error) => {
      addToast(extractApiError(error, "Failed to update transaction"), "error");
    },
  });

  const label = FIELD_LABELS[field];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let update: TransactionFieldUpdate;
    switch (field) {
      case "amount": {
        const error = validateNumber(value, "Amount", { min: 0.01 });
        if (error) {
          addToast(error.message, "error");
          return;
        }
        update = { amount: Number(value) };
        break;
      }
      case "date":
        if (!value) {
          addToast("Date is required", "error");
          return;
        }
        update = { date: dateToApiISO(value) };
        break;
      case "description":
        update = { description: value.trim() };
        break;
      case "categoryId":
        update = { categoryId: value || null };
        break;
    }

    updateMutation.mutate({ id: transaction.id, update });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Edit ${label}`}
      description={`Change the ${label.toLowerCase()} for this transaction.`}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            {label}
          </label>
          {field === "description" && (
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          )}
          {field === "amount" && (
            <CurrencyInput value={value} onChange={setValue} required />
          )}
          {field === "date" && (
            <DatePicker value={value} onChange={setValue} required />
          )}
          {field === "categoryId" && (
            <select
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : `Save ${label}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditableTransactionCell({
  label,
  onEdit,
  children,
  className,
  contentClassName,
}: {
  label: string;
  onEdit: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <td className={cn("p-0", className)}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        aria-label={`Edit ${label}`}
        title={`Edit ${label}`}
        className={cn(
          "group/cell flex min-h-full w-full items-center gap-2 px-7 py-5 text-left transition-colors hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
          contentClassName,
        )}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100" />
      </button>
    </td>
  );
}
