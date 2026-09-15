import { format } from "date-fns";
import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { BudgetDetail } from "../budget.types";

interface BudgetPeriodItemProps {
  budget: BudgetDetail;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetPeriodItem({
  budget,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: BudgetPeriodItemProps) {
  const isOver = budget.percentage > 100;
  const displayPercentage = Math.min(budget.percentage, 999);

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(budget.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(budget.startDate), "dd MMM yyyy")} -{" "}
            {format(new Date(budget.endDate), "dd MMM yyyy")}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu();
            }}
            className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={onEdit}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-sky-500/[0.05] transition-colors"
              >
                <Edit2 className="w-4 h-4 text-sky-400" /> Edit
              </button>
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            isOver ? "bg-rose-500" : "bg-sky-500",
          )}
          style={{ width: `${Math.min(displayPercentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span
          className={cn(
            "font-medium",
            isOver ? "text-rose-400" : "text-sky-400",
          )}
        >
          {formatCurrency(budget.spent)} spent ({displayPercentage}%)
        </span>
        <span className={cn(isOver ? "text-rose-400" : "text-slate-400")}>
          {isOver
            ? `Over ${formatCurrency(Math.abs(budget.remaining))}`
            : `${formatCurrency(budget.remaining)} left`}
        </span>
      </div>
    </div>
  );
}
