"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import type { DebtPoint } from "@/lib/types";
import { DebtCard } from "./debt-card";

interface DebtGridProps {
  debts: DebtPoint[];
  isDeleting: boolean;
  onEdit: (debt: DebtPoint) => void;
  onDelete: (id: string) => void;
}

export function DebtGrid({ debts, isDeleting, onEdit, onDelete }: DebtGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {debts.map((debt, index) => (
        <DebtCard
          key={debt.id}
          debt={debt}
          index={index}
          isDeleting={isDeleting}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {debts.length === 0 && (
        <EmptyState
          image="/empty-debts.webp"
          title="No overspent budgets"
          description="You are on track! Debt points will appear here when budgets are exceeded."
        />
      )}
    </div>
  );
}
