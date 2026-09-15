"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import type { Budget } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import type { AggregatedBudget } from "../budget.types";
import { BudgetPeriodItem } from "./budget-period-item";

interface BudgetDetailsModalProps {
  isOpen: boolean;
  budget: AggregatedBudget | undefined;
  budgetRecords: Budget[];
  isDeleting: boolean;
  onClose: () => void;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export function BudgetDetailsModal({
  isOpen,
  budget,
  budgetRecords,
  isDeleting,
  onClose,
  onEdit,
  onDelete,
}: BudgetDetailsModalProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMenuId) return;

    function handleClickOutside() {
      setActiveMenuId(null);
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeMenuId]);

  const handleClose = () => {
    setActiveMenuId(null);
    onClose();
  };

  const handleEdit = (id: string) => {
    const budgetRecord = budgetRecords.find((record) => record.id === id);
    if (budgetRecord) onEdit(budgetRecord);
    setActiveMenuId(null);
  };

  const isOver = budget ? budget.percentage > 100 : false;
  const displayPercentage = budget ? Math.min(budget.percentage, 999) : 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={budget?.category?.name || "Uncategorized"}
        description="Budget breakdown"
      >
        {budget && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-background p-5 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Budgeted
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(budget.totalAmount)}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold uppercase",
                    budget.status === "WITHIN_BUDGET"
                      ? "bg-sky-500/20 text-sky-300"
                      : budget.status === "OVER_BUDGET"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-muted text-slate-300",
                  )}
                >
                  {budget.status.replace("_", " ")}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    isOver ? "bg-rose-500" : "bg-sky-500",
                  )}
                  style={{ width: `${Math.min(displayPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span
                  className={cn(
                    "font-semibold",
                    isOver ? "text-rose-400" : "text-sky-400",
                  )}
                >
                  {formatCurrency(budget.spent)} spent
                </span>
                <span
                  className={cn(
                    isOver ? "text-rose-400" : "text-slate-400",
                  )}
                >
                  {isOver
                    ? `Over by ${formatCurrency(Math.abs(budget.remaining))}`
                    : `${formatCurrency(budget.remaining)} left`}
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Individual Budgets
              </p>
              {budget.budgets.map((period) => (
                <BudgetPeriodItem
                  key={period.id}
                  budget={period}
                  isMenuOpen={activeMenuId === period.id}
                  onToggleMenu={() =>
                    setActiveMenuId((current) =>
                      current === period.id ? null : period.id,
                    )
                  }
                  onEdit={() => handleEdit(period.id)}
                  onDelete={() => {
                    setBudgetToDelete(period.id);
                    setActiveMenuId(null);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={budgetToDelete !== null}
        onConfirm={() => {
          if (budgetToDelete) onDelete(budgetToDelete);
        }}
        onCancel={() => setBudgetToDelete(null)}
        title="Delete budget?"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </>
  );
}
