"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { DebtPoint } from "@/lib/types";
import { DebtGrid } from "./components/debt-grid";
import { DebtsHeader } from "./components/debts-header";
import { DebtsLoading } from "./components/debts-loading";
import { DebtsSummary } from "./components/debts-summary";
import { EditDebtModal } from "./components/edit-debt-modal";
import { useDebts } from "./hooks/use-debts";

export default function DebtsPage() {
  const [editDebt, setEditDebt] = useState<DebtPoint | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const {
    budgets,
    debts,
    totalDebt,
    isLoading,
    updateDebt,
    deleteDebt,
    isUpdating,
    isDeleting,
  } = useDebts({
    onUpdateSuccess: () => {
      setEditDebt(null);
      setEditAmount("");
    },
  });

  if(isLoading) {
    return <DebtsLoading />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <DebtsHeader />
      <DebtsSummary
        totalDebt={totalDebt}
        debtCount={debts.length}
        budgetCount={budgets.length}
      />
      <DebtGrid
        debts={debts}
        isDeleting={isDeleting}
        onEdit={(debt) => {
          setEditDebt(debt);
          setEditAmount(String(debt.debtAmount));
        }}
        onDelete={(id) => {
          setDebtToDelete(id);
          setShowDeleteConfirm(true);
        }}
      />

      <EditDebtModal
        debt={editDebt}
        amount={editAmount}
        isSaving={isUpdating}
        onAmountChange={setEditAmount}
        onClose={() => setEditDebt(null)}
        onSave={() => {
          if(editAmount && editDebt) {
            updateDebt({ id: editDebt.id, debtAmount: Number(editAmount) });
          }
        }}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => {
          if(debtToDelete) {
            deleteDebt(debtToDelete);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete debt?"
        description="Are you sure you want to delete this debt? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
