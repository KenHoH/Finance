"use client";

import { useState } from "react";
import type { Budget } from "@/lib/types";
import { BudgetDetailsModal } from "./components/budget-details-modal";
import { BudgetGrid } from "./components/budget-grid";
import { BudgetsHeader } from "./components/budgets-header";
import { BudgetsLoading } from "./components/budgets-loading";
import { BudgetsSummary } from "./components/budgets-summary";
import { CreateBudgetModal } from "./components/create-budget-modal";
import { EditBudgetModal } from "./components/edit-budget-modal";
import { useBudgets } from "./hooks/use-budgets";

export default function BudgetsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const {
    aggregated,
    budgets,
    categories,
    isLoading,
    createBudget,
    updateBudget,
    deleteBudget,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    clearCreateError,
    clearUpdateError,
  } = useBudgets();

  const selectedBudget = aggregated.find(
    (budget) =>
      (budget.category?.id ?? "uncategorized") === selectedCategoryId,
  );

  if (isLoading) return <BudgetsLoading />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <BudgetsHeader onCreateBudget={() => setIsCreateOpen(true)} />

      <CreateBudgetModal
        isOpen={isCreateOpen}
        categories={categories}
        isCreating={isCreating}
        error={createError}
        onClose={() => setIsCreateOpen(false)}
        onClearError={clearCreateError}
        onCreate={createBudget}
      />

      <BudgetsSummary budgets={aggregated} />

      <BudgetGrid
        budgets={aggregated}
        onSelectBudget={(budget) =>
          setSelectedCategoryId(budget.category?.id ?? "uncategorized")
        }
      />

      <BudgetDetailsModal
        isOpen={selectedCategoryId !== null}
        budget={selectedBudget}
        budgetRecords={budgets}
        isDeleting={isDeleting}
        onClose={() => setSelectedCategoryId(null)}
        onEdit={(budget) => {
          setEditBudget(budget);
          setSelectedCategoryId(null);
        }}
        onDelete={deleteBudget}
      />

      <EditBudgetModal
        key={editBudget?.id ?? "closed"}
        budget={editBudget}
        isUpdating={isUpdating}
        error={updateError}
        onClose={() => setEditBudget(null)}
        onClearError={clearUpdateError}
        onUpdate={updateBudget}
      />
    </div>
  );
}
