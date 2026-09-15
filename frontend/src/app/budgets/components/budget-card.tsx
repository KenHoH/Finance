import { motion } from "framer-motion";
import { CheckCircle2, PieChart } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { CATEGORY_LUCIDE_ICONS } from "@/lib/category-lucide-icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { AggregatedBudget } from "../budget.types";

const lucideIcons = Object.fromEntries(
  CATEGORY_LUCIDE_ICONS.map((icon) => [icon.name, icon.component]),
);

interface BudgetCardProps {
  budget: AggregatedBudget;
  index: number;
  onClick: () => void;
}

export function BudgetCard({ budget, index, onClick }: BudgetCardProps) {
  const isOver = budget.percentage > 100;
  const displayPercentage = Math.min(budget.percentage, 999);
  const LucideIcon = budget.category?.icon
    ? lucideIcons[budget.category.icon]
    : undefined;
  const categoryIcon = getCategoryIcon(budget.category?.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      onClick={onClick}
      className="rounded-xl border border-border p-6 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center text-primary shadow-sm border border-border group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            {LucideIcon ? (
              <LucideIcon className="w-8 h-8" />
            ) : categoryIcon ? (
              <img
                src={categoryIcon}
                alt=""
                className="w-14 h-14 object-contain"
              />
            ) : (
              <PieChart className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {budget.category?.name || "Uncategorized"}
            </h3>
            <span
              className={cn(
                "inline-flex mt-1.5 px-2 py-0.5 rounded-md text-xs font-semibold uppercase",
                budget.status === "WITHIN_BUDGET"
                  ? "bg-sky-500/20 text-sky-300"
                  : budget.status === "OVER_BUDGET"
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-muted text-slate-300",
              )}
            >
              {budget.status?.replace("_", " ") || "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <span
            className={cn(
              "text-2xl font-bold tracking-tight",
              isOver ? "text-rose-400" : "text-sky-400",
            )}
          >
            {formatCurrency(budget.spent)}
          </span>
          <span className="text-sm font-medium text-slate-400">
            of {formatCurrency(budget.totalAmount)}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              isOver ? "bg-rose-500" : "bg-sky-500",
            )}
            style={{ width: `${Math.min(displayPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-sm font-medium">
          <span className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2
              className={cn(
                "w-4 h-4",
                isOver ? "text-rose-400" : "text-sky-400",
              )}
            />
            {isOver
              ? `>${displayPercentage.toFixed(0)}% Used`
              : `${displayPercentage.toFixed(0)}% Used`}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full border border-border text-xs",
              isOver
                ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                : "text-slate-400 bg-slate-800/60",
            )}
          >
            {isOver
              ? `Over by ${formatCurrency(Math.abs(budget.remaining))}`
              : `${formatCurrency(budget.remaining)} left`}
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {budget.budgets.length} budget
          {budget.budgets.length > 1 ? "s" : ""} period
        </span>
        <span className="text-xs text-sky-400 font-medium">
          Click to view details
        </span>
      </div>
    </motion.div>
  );
}
