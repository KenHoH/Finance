"use client";

import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import type { DebtPoint } from "@/lib/types";

interface EditDebtModalProps {
  debt: DebtPoint | null;
  amount: string;
  isSaving: boolean;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditDebtModal({
  debt,
  amount,
  isSaving,
  onAmountChange,
  onClose,
  onSave,
}: EditDebtModalProps) {
  return (
    <Modal
      isOpen={!!debt}
      onClose={onClose}
      title="Edit Debt"
      description={debt?.budget?.category?.name || "Uncategorized"}
    >
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Debt Amount</label>
        <CurrencyInput
          value={amount}
          onChange={onAmountChange}
          placeholder="0"
        />
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
