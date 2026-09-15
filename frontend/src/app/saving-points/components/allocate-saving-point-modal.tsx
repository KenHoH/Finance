import { useState } from "react";
import { AlertTriangle, Landmark, Target, TrendingUp } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import { cn, formatCurrency } from "@/lib/utils";
import { runValidators, validateNumber } from "@/lib/validation";
import { useToastStore } from "@/store/useToastStore";
import type { SavingPointsFeature } from "../hooks/use-saving-points";
import type {
  AllocatableSavingPoint,
  AllocationTab,
} from "./saving-point.types";

interface AllocateSavingPointModalProps {
  point: AllocatableSavingPoint | null;
  onClose: () => void;
  savingPoints: SavingPointsFeature;
}

export function AllocateSavingPointModal({
  point,
  onClose,
  savingPoints,
}: AllocateSavingPointModalProps) {
  const addToast = useToastStore((state) => state.addToast);
  const [goalId, setGoalId] = useState("");
  const [allocateAmount, setAllocateAmount] = useState("");
  const [note, setNote] = useState("");
  const [allocateTab, setAllocateTab] = useState<AllocationTab>("goal");
  const [investCategoryId, setInvestCategoryId] = useState("");
  const [debtPointId, setDebtPointId] = useState("");

  const isPending =
    savingPoints.allocateGoalMutation.isPending ||
    savingPoints.allocateInvestmentMutation.isPending ||
    savingPoints.payDebtMutation.isPending;

  const handleAllocate = () => {
    const errors = runValidators(
      validateNumber(allocateAmount, "Amount", { min: 0.01 }),
    );
    if (errors.length > 0) {
      addToast(errors[0].message, "error");
      return;
    }
    if (point && Number(allocateAmount) > point.amount) {
      addToast("Allocation cannot exceed available amount", "error");
      return;
    }
    if (!point) return;

    const allocation = {
      id: point.id,
      amount: Number(allocateAmount),
      note: note || undefined,
    };

    if (allocateTab === "goal") {
      if (!goalId) {
        addToast("Select a goal", "error");
        return;
      }
      savingPoints.allocateGoalMutation.mutate(
        { ...allocation, goalId },
        {
          onSuccess: () => {
            onClose();
            setGoalId("");
            setAllocateAmount("");
            setNote("");
            setAllocateTab("goal");
          },
        },
      );
      return;
    }

    if (allocateTab === "investment") {
      if (!investCategoryId) {
        addToast("Select an investment category", "error");
        return;
      }
      savingPoints.allocateInvestmentMutation.mutate(
        { ...allocation, categoryId: investCategoryId },
        {
          onSuccess: () => {
            onClose();
            setInvestCategoryId("");
            setAllocateAmount("");
            setNote("");
            setAllocateTab("goal");
          },
        },
      );
      return;
    }

    if (!debtPointId) {
      addToast("Select a debt", "error");
      return;
    }
    savingPoints.payDebtMutation.mutate(
      { ...allocation, debtPointId },
      {
        onSuccess: () => {
          onClose();
          setDebtPointId("");
          setAllocateAmount("");
          setNote("");
          setAllocateTab("goal");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={!!point}
      onClose={onClose}
      title="Allocate Surplus"
      description={point ? `Available: ${formatCurrency(point.amount)}` : ""}
    >
      <div className="flex gap-1 rounded-lg bg-muted p-1 mb-4">
        {(["goal", "investment", "debt"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAllocateTab(tab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              allocateTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "goal" && <Target className="w-3.5 h-3.5" />}
            {tab === "investment" && (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
            {tab === "debt" && <Landmark className="w-3.5 h-3.5" />}
            {tab === "goal"
              ? "Goal"
              : tab === "investment"
                ? "Investment"
                : "Pay Debt"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {allocateTab === "goal" && (
          <div>
            <label
              htmlFor="goal-select"
              className="text-sm font-medium text-foreground mb-1 block"
            >
              Goal
            </label>
            <select
              id="goal-select"
              value={goalId}
              onChange={(event) => setGoalId(event.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Select goal</option>
              {savingPoints.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name} ({formatCurrency(Number(goal.currentAmount))} /{" "}
                  {formatCurrency(Number(goal.targetAmount))})
                </option>
              ))}
            </select>
          </div>
        )}

        {allocateTab === "investment" && (
          <div>
            <label
              htmlFor="invest-select"
              className="text-sm font-medium text-foreground mb-1 block"
            >
              Investment Category
            </label>
            <select
              id="invest-select"
              value={investCategoryId}
              onChange={(event) => setInvestCategoryId(event.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Select category</option>
              {savingPoints.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {allocateTab === "debt" && (
          <div>
            <label
              htmlFor="debt-select"
              className="text-sm font-medium text-foreground mb-1 block"
            >
              Debt to Pay
            </label>
            <select
              id="debt-select"
              value={debtPointId}
              onChange={(event) => setDebtPointId(event.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Select debt</option>
              {savingPoints.debtPoints.map((debtPoint) => (
                <option key={debtPoint.id} value={debtPoint.id}>
                  {debtPoint.budget?.category?.name || "Budget"} —{" "}
                  {formatCurrency(Number(debtPoint.debtAmount))}
                </option>
              ))}
            </select>
            {savingPoints.debtPoints.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No debts available
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="allocate-amount"
            className="text-sm font-medium text-foreground mb-1 block"
          >
            Amount
          </label>
          <CurrencyInput
            id="allocate-amount"
            value={allocateAmount}
            onChange={setAllocateAmount}
            placeholder="0"
          />
        </div>
        <div>
          <label
            htmlFor="allocate-note"
            className="text-sm font-medium text-foreground mb-1 block"
          >
            Note (optional)
          </label>
          <input
            id="allocate-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Budget surplus allocation"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAllocate}
          disabled={isPending}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
        >
          Allocate
        </button>
      </div>
    </Modal>
  );
}
