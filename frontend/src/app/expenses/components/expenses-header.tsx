"use client";

import { CreditCard, Plus } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

export enum TimeFilter {
  thisMonth = "thisMonth",
  lastMonth = "lastMonth",
  thisYear = "thisYear",
  lastYear = "lastYear",
  allTime = "allTime",
}

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  [TimeFilter.thisMonth]: "This Month",
  [TimeFilter.lastMonth]: "Last Month",
  [TimeFilter.thisYear]: "This Year",
  [TimeFilter.lastYear]: "Last Year",
  [TimeFilter.allTime]: "All Time",
};

interface ExpensesHeaderProps {
  startDate: string;
  endDate: string;
  timeFilter: TimeFilter | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onAddExpense: () => void;
}

export function ExpensesHeader({
  startDate,
  endDate,
  timeFilter,
  onStartDateChange,
  onEndDateChange,
  onTimeFilterChange,
  onAddExpense,
}: ExpensesHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <CreditCard className="w-5 h-5 text-red-400" />
          </div>
          Expenses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and analyze your spending habits
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border">
          {(Object.values(TimeFilter) as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => onTimeFilterChange(filter)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                timeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sky-500/[0.03]",
              )}
            >
              {TIME_FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Date
          </label>
          <DatePicker value={startDate} onChange={onStartDateChange} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Date
          </label>
          <DatePicker value={endDate} onChange={onEndDateChange} />
        </div>
        <button
          onClick={onAddExpense}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] hover:brightness-110 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>
    </header>
  );
}
