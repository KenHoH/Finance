import { EmptyState } from "@/components/ui/EmptyState";
import type { AggregatedBudget } from "../budget.types";
import { BudgetCard } from "./budget-card";

interface BudgetGridProps {
  budgets: AggregatedBudget[];
  onSelectBudget: (budget: AggregatedBudget) => void;
}

export function BudgetGrid({ budgets, onSelectBudget }: BudgetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {budgets.map((budget, index) => (
        <BudgetCard
          key={budget.category?.id ?? "uncategorized"}
          budget={budget}
          index={index}
          onClick={() => onSelectBudget(budget)}
        />
      ))}
      {budgets.length === 0 && (
        <EmptyState
          title="No budgets created yet"
          description="Set monthly spending limits per category to stay in control."
        />
      )}
    </div>
  );
}
