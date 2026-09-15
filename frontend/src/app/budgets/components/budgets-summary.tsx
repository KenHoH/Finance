import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import type { AggregatedBudget } from "../budget.types";

interface BudgetsSummaryProps {
  budgets: AggregatedBudget[];
}

export function BudgetsSummary({ budgets }: BudgetsSummaryProps) {
  const totalBudgeted = budgets.reduce(
    (total, budget) => total + budget.totalAmount,
    0,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-9"
      >
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Total Budgeted
        </p>
        <p className="text-3xl font-bold text-foreground">
          {formatCurrency(totalBudgeted)}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-9"
      >
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Active Budgets
        </p>
        <p className="text-3xl font-bold text-foreground">{budgets.length}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-9"
      >
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Budget Records
        </p>
        <p className="text-3xl font-bold text-foreground">
          {budgets.filter((budget) => budget.category).length}
        </p>
      </motion.div>
    </div>
  );
}
