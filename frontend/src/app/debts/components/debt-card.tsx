"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Edit2, Trash2, TrendingDown } from "lucide-react";
import type { DebtPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface DebtCardProps {
  debt: DebtPoint;
  index: number;
  isDeleting: boolean;
  onEdit: (debt: DebtPoint) => void;
  onDelete: (id: string) => void;
}

export function DebtCard({ debt, index, isDeleting, onEdit, onDelete }: DebtCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className="rounded-xl border border-border p-6 flex flex-col justify-between relative group overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 shadow-sm border border-border group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">
              {debt.budget?.category?.name || "Uncategorized"}
            </h3>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">Overbudget</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(debt)}
            className="p-1.5 text-muted-foreground hover:bg-sky-500/[0.05] rounded-lg transition-colors"
            aria-label="Edit debt"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(debt.id)}
            disabled={isDeleting}
            className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            aria-label="Delete debt"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-3xl font-black tracking-tight text-rose-500">
          {formatCurrency(Number(debt.debtAmount))}
        </p>
        <div className="flex items-center gap-1 text-sm font-extrabold text-rose-500 mt-2">
          <AlertTriangle className="w-5 h-5" /> Overspent
        </div>
      </div>
    </motion.div>
  );
}
