import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface SavingPointsSummaryProps {
  totalSaved: number;
  activePoints: number;
  availableGoals: number;
}

export function SavingPointsSummary({
  totalSaved,
  activePoints,
  availableGoals,
}: SavingPointsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-7"
      >
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Saved
        </p>
        <p className="text-3xl font-bold text-sky-400">
          {formatCurrency(totalSaved)}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-7"
      >
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Active Points
        </p>
        <p className="text-3xl font-bold text-foreground">{activePoints}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-7"
      >
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Available Goals
        </p>
        <p className="text-3xl font-bold text-foreground">{availableGoals}</p>
      </motion.div>
    </div>
  );
}
