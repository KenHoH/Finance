"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDesc?: boolean;
  onSort?: (key: string) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * Reusable sortable data table.
 */
export function DataTable<T extends { id?: string }>({
  columns,
  data,
  sortKey,
  sortDesc,
  onSort,
  className,
  emptyMessage = "No data found.",
}: DataTableProps<T>){
  if(!data.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 text-xs font-medium text-muted-foreground",
                  col.sortable && "cursor-pointer select-none"
                )}
                onClick={() => col.sortable && onSort?.(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className="border-b border-border/50 transition-colors hover:bg-accent/20 last:border-0"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-xs text-foreground">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
