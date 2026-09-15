import { useState } from "react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import type { SavingPoint } from "@/lib/types";
import { validateNumber } from "@/lib/validation";
import { useToastStore } from "@/store/useToastStore";
import type { SavingPointsFeature } from "../hooks/use-saving-points";

interface EditSavingPointModalProps {
  point: SavingPoint | null;
  onClose: () => void;
  savingPoints: SavingPointsFeature;
}

export function EditSavingPointModal({
  point,
  onClose,
  savingPoints,
}: EditSavingPointModalProps) {
  return (
    <Modal
      isOpen={!!point}
      onClose={onClose}
      title="Edit Saving Point"
      description={point?.budget?.category?.name || "Budget"}
    >
      {point && (
        <EditSavingPointForm
          point={point}
          onClose={onClose}
          savingPoints={savingPoints}
        />
      )}
    </Modal>
  );
}

function EditSavingPointForm({
  point,
  onClose,
  savingPoints,
}: EditSavingPointModalProps & { point: SavingPoint }) {
  const addToast = useToastStore((state) => state.addToast);
  const [editAmount, setEditAmount] = useState(String(point.savingAmount));

  const handleSave = () => {
    const error = validateNumber(editAmount, "Saving Amount", { min: 0.01 });
    if (error) {
      addToast(error.message, "error");
      return;
    }

    savingPoints.updateMutation.mutate(
      {
        id: point.id,
        savingAmount: Number(editAmount),
      },
      {
        onSuccess: () => {
          onClose();
          setEditAmount("");
        },
      },
    );
  };

  return (
    <>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Saving Amount
        </label>
        <CurrencyInput
          value={editAmount}
          onChange={setEditAmount}
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
          onClick={handleSave}
          disabled={savingPoints.updateMutation.isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
        >
          {savingPoints.updateMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </>
  );
}
