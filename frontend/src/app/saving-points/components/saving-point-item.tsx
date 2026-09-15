import { format } from "date-fns";
import { motion } from "framer-motion";
import { Edit2, Target, Trash2, Wallet } from "lucide-react";
import type { SavingPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SavingPointItemProps {
  point: SavingPoint;
  index: number;
  onAllocate: (point: SavingPoint) => void;
  onEdit: (point: SavingPoint) => void;
  onDelete: (id: string) => void;
}

export function SavingPointItem({
  point,
  index,
  onAllocate,
  onEdit,
  onDelete,
}: SavingPointItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-sky-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {point.budget?.category?.name || "Budget"} —{" "}
            {formatCurrency(Number(point.savingAmount))}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(point.createdAt), "dd MMM yyyy")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onAllocate(point)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Target className="w-3.5 h-3.5" /> Allocate
        </button>
        <button
          onClick={() => onEdit(point)}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          aria-label="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(point.id)}
          className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
