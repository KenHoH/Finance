"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import {
  EditableTransactionCell,
  type EditableTransactionField,
} from "@/components/common/TransactionFieldEditModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { getCategoryIcon } from "@/lib/category-icons";
import { getLucideIcon } from "@/lib/category-lucide-icons";
import type { Transaction } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type IncomeTableTransaction = Transaction & { parsedDate: Date };

interface IncomeTableProps {
  transactions: IncomeTableTransaction[];
  itemsPerPage: number;
  pageIndex: number;
  hasNextPage: boolean;
  searchQuery: string;
  onItemsPerPageChange: (limit: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onSearchChange: (value: string) => void;
  onSelectTransaction: (transaction: Transaction) => void;
  onEditTransactionField: (
    transaction: Transaction,
    field: EditableTransactionField,
  ) => void;
}

export function IncomeTable({
  transactions,
  itemsPerPage,
  pageIndex,
  hasNextPage,
  searchQuery,
  onItemsPerPageChange,
  onPreviousPage,
  onNextPage,
  onSearchChange,
  onSelectTransaction,
  onEditTransactionField,
}: IncomeTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
            Recent Income
          </h3>
          <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border">
            {[25, 50, 100].map((limit) => (
              <button
                key={limit}
                onClick={() => onItemsPerPageChange(limit)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                  itemsPerPage === limit
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-sky-500/[0.03]",
                )}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPreviousPage}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03] disabled:opacity-50 disabled:pointer-events-none transition-all"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-medium text-muted-foreground w-16 text-center">
              Page {pageIndex + 1}
            </span>

            <button
              onClick={onNextPage}
              disabled={!hasNextPage}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03] disabled:opacity-50 disabled:pointer-events-none transition-all"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search..."
            className="w-full sm:w-56"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-base font-semibold">
            <tr>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Description</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Source</th>
              <th className="px-7 py-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                onClick={() => onSelectTransaction(transaction)}
                className="hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <EditableTransactionCell
                  label="date"
                  onEdit={() =>
                    onEditTransactionField(transaction, "date")
                  }
                  contentClassName="whitespace-nowrap font-medium"
                >
                  {format(transaction.parsedDate, "dd MMM yyyy")}
                </EditableTransactionCell>
                <EditableTransactionCell
                  label="description"
                  onEdit={() =>
                    onEditTransactionField(transaction, "description")
                  }
                  contentClassName="font-bold"
                >
                  {transaction.description || "-"}
                </EditableTransactionCell>
                <EditableTransactionCell
                  label="category"
                  onEdit={() =>
                    onEditTransactionField(transaction, "categoryId")
                  }
                  contentClassName="px-6"
                >
                  <span className="inline-flex items-center justify-center gap-2 px-4 h-10 w-[160px] bg-accent text-foreground rounded-full text-sm font-bold border border-border">
                    {(() => {
                      const LucideIcon = getLucideIcon(
                        transaction.category?.icon,
                      );
                      if (LucideIcon)
                        return (
                          <LucideIcon
                            className="w-9 h-9 text-primary shrink-0"
                            strokeWidth={2.5}
                          />
                        );
                      const icon = getCategoryIcon(transaction.category?.name);
                      if (icon)
                        return (
                          <img
                            src={icon}
                            alt=""
                            className="w-9 h-9 object-contain shrink-0"
                          />
                        );
                      return null;
                    })()}
                    <span className="truncate">
                      {transaction.category?.name || "Uncategorized"}
                    </span>
                  </span>
                </EditableTransactionCell>
                <td className="px-7 py-5 text-muted-foreground font-medium capitalize">
                  {transaction.source || "manual"}
                </td>
                <EditableTransactionCell
                  label="amount"
                  onEdit={() =>
                    onEditTransactionField(transaction, "amount")
                  }
                  contentClassName="text-right font-bold text-sky-500"
                >
                  +{formatCurrency(Number(transaction.amount))}
                </EditableTransactionCell>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-9">
                  <EmptyState
                    title="No income found"
                    description="Record your first income to start tracking your earnings."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
