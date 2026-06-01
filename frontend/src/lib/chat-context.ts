/**
 * Financial context builder for FinBot.
 * Reads React Query cache to build a summary of the user's financial data.
 */

import type { QueryClient } from "@tanstack/react-query";
import type { Transaction, Budget, Goal, Investment, Bill, DebtPoint, SavingPoint } from "./types";

function getCacheData<T>(queryClient: QueryClient, queryKey: unknown[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function buildFinancialContext(queryClient: QueryClient): string {
  const lines: string[] = [];

  // Income
  const incomeTxs = getCacheData<Transaction[]>(queryClient, ["transactions", "INCOME"]);
  if(incomeTxs && incomeTxs.length > 0) {
    const totalIncome = incomeTxs.reduce((s, t) => {
      const a = typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount || 0);
      return s + (isNaN(a) ? 0 : a);
    }, 0);
    lines.push(`Total Income (all time): ${formatRupiah(totalIncome)}`);
  } else {
    lines.push("Total Income (all time): No income data recorded yet.");
  }

  // Expenses
  const expenseTxs = getCacheData<Transaction[]>(queryClient, ["transactions", "EXPENSE"]);
  if(expenseTxs && expenseTxs.length > 0) {
    const totalExpenses = expenseTxs.reduce((s, t) => {
      const a = typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount || 0);
      return s + (isNaN(a) ? 0 : a);
    }, 0);
    lines.push(`Total Expenses (all time): ${formatRupiah(totalExpenses)}`);
    if(incomeTxs) {
      const totalIncome = incomeTxs.reduce((s, t) => {
        const a = typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount || 0);
        return s + (isNaN(a) ? 0 : a);
      }, 0);
      lines.push(`Net Balance: ${formatRupiah(totalIncome - totalExpenses)}`);
    }
  } else {
    lines.push("Total Expenses (all time): No expense data recorded yet.");
  }

  // Budgets
  const budgets = getCacheData<Budget[]>(queryClient, ["budgets"]);
  if(budgets && budgets.length > 0) {
    lines.push(`Active Budgets: ${budgets.length}`);
    const statuses = getCacheData<Record<string, { status: string; spent: number; remaining: number }>>(queryClient, ["budgets", "statuses"]);
    for(const b of budgets) {
      const catName = b.category?.name || "Uncategorized";
      if(statuses && statuses[b.id]) {
        const st = statuses[b.id];
        const pct = b.amount > 0 ? Math.round((st.spent / b.amount) * 100) : 0;
        lines.push(`  - ${catName}: ${formatRupiah(b.amount)} budget, ${formatRupiah(st.spent)} spent (${pct}%), ${formatRupiah(st.remaining)} remaining`);
      } else {
        lines.push(`  - ${catName}: ${formatRupiah(b.amount)} budget`);
      }
    }
  } else {
    lines.push("Active Budgets: No budgets set yet.");
  }

  // Goals
  const goals = getCacheData<Goal[]>(queryClient, ["goals"]);
  if(goals && goals.length > 0) {
    const inProgress = goals.filter((g) => g.status === "IN_PROGRESS").length;
    const completed = goals.filter((g) => g.status === "COMPLETED" || g.status === "ACHIEVED").length;
    lines.push(`Goals: ${goals.length} total (${inProgress} in progress, ${completed} completed)`);
    const sorted = [...goals]
      .filter((g) => g.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    if(sorted.length > 0) {
      const closest = sorted[0];
      const pct = closest.targetAmount > 0 ? Math.round((closest.currentAmount / closest.targetAmount) * 100) : 0;
      lines.push(`  - Closest deadline: "${closest.name}" due ${closest.deadline}, ${formatRupiah(closest.currentAmount)} / ${formatRupiah(closest.targetAmount)} (${pct}%)`);
    }
  } else {
    lines.push("Goals: No goals set yet.");
  }

  // Investments
  const investments = getCacheData<Investment[]>(queryClient, ["investments"]);
  if(investments && investments.length > 0) {
    const total = investments.reduce((s, inv) => {
      const a = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
      return s + (isNaN(a) ? 0 : a);
    }, 0);
    lines.push(`Total Investments: ${formatRupiah(total)} across ${investments.length} categories`);
    for(const inv of investments) {
      const a = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
      lines.push(`  - ${inv.category?.name || "Unknown"}: ${formatRupiah(a)}`);
    }
  } else {
    lines.push("Total Investments: No investments tracked yet.");
  }

  // Bills
  const bills = getCacheData<Bill[]>(queryClient, ["bills"]);
  if(bills && bills.length > 0) {
    const pending = bills.filter((b) => b.status === "PENDING").length;
    const overdue = bills.filter((b) => b.status === "OVERDUE").length;
    lines.push(`Bills: ${bills.length} total (${pending} pending, ${overdue} overdue)`);
    const upcoming = [...bills]
      .filter((b) => b.status !== "PAID")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    if(upcoming) {
      lines.push(`  - Next due: "${upcoming.title}" (${formatRupiah(upcoming.amount)}) on ${upcoming.dueDate}`);
    }
  } else {
    lines.push("Bills: No bills recorded yet.");
  }

  // Debts
  const debts = getCacheData<DebtPoint[]>(queryClient, ["debts"]);
  if(debts && debts.length > 0) {
    const totalDebt = debts.reduce((s, d) => {
      const a = typeof d.debtAmount === "string" ? parseFloat(d.debtAmount) : (d.debtAmount || 0);
      return s + (isNaN(a) ? 0 : a);
    }, 0);
    lines.push(`Total Debt: ${formatRupiah(totalDebt)} across ${debts.length} debt points`);
  } else {
    lines.push("Debts: No debt points recorded yet.");
  }

  // Saving Points
  const savingPoints = getCacheData<SavingPoint[]>(queryClient, ["saving-points"]);
  if(savingPoints && savingPoints.length > 0) {
    const totalSaved = savingPoints.reduce((s, p) => {
      const a = typeof p.savingAmount === "string" ? parseFloat(p.savingAmount) : (p.savingAmount || 0);
      return s + (isNaN(a) ? 0 : a);
    }, 0);
    lines.push(`Total Saving Points: ${formatRupiah(totalSaved)} across ${savingPoints.length} points`);
  } else {
    lines.push("Saving Points: No saving points recorded yet.");
  }

  return lines.join("\n");
}
