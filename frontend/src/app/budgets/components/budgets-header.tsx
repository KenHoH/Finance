import { PieChart, Plus } from "lucide-react";

interface BudgetsHeaderProps {
  onCreateBudget: () => void;
}

export function BudgetsHeader({ onCreateBudget }: BudgetsHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <PieChart className="w-5 h-5 text-sky-400" />
          </div>
          Budgets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control your spending limits per category
        </p>
      </div>

      <button
        onClick={onCreateBudget}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
      >
        <Plus className="w-5 h-5" /> Create Budget
      </button>
    </header>
  );
}
