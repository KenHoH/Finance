"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import type { Budget } from "@/lib/types";
import { apiDateToInput, dateToApiISO } from "@/lib/utils";
import type { UpdateBudgetInput } from "../budget.types";

interface EditBudgetModalProps {
  budget: Budget | null;
  isUpdating: boolean;
  error: string;
  onClose: () => void;
  onClearError: () => void;
  onUpdate: (input: UpdateBudgetInput, onSuccess: () => void) => void;
}

export function EditBudgetModal({
  budget,
  isUpdating,
  error,
  onClose,
  onClearError,
  onUpdate,
}: EditBudgetModalProps) {
  const [amount, setAmount] = useState(() =>
    budget ? String(budget.amount) : "",
  );
  const [startDate, setStartDate] = useState(() =>
    budget ? apiDateToInput(budget.startDate) : "",
  );
  const [endDate, setEndDate] = useState(() =>
    budget ? apiDateToInput(budget.endDate) : "",
  );

  const handleClose = () => {
    onClearError();
    onClose();
  };

  const handleSave = () => {
    if (!amount || !startDate || !endDate || !budget) return;

    onUpdate(
      {
        id: budget.id,
        amount: Number(amount),
        startDate: dateToApiISO(startDate),
        endDate: dateToApiISO(endDate),
      },
      handleClose,
    );
  };

  return (
    <Modal
      isOpen={Boolean(budget)}
      onClose={handleClose}
      title="Edit Budget"
      description={budget?.category ? budget.category.name : "Uncategorized"}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Amount
          </label>
          <CurrencyInput
            value={amount}
            onChange={(value: string) => {
              setAmount(value);
              onClearError();
            }}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Start Date
          </label>
          <DatePicker
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              onClearError();
            }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            End Date
          </label>
          <DatePicker
            value={endDate}
            onChange={(value) => {
              setEndDate(value);
              onClearError();
            }}
          />
        </div>
      </div>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
