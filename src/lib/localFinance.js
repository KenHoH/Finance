export function todayInputValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function readList(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeList(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private windows; the in-memory state still works.
  }
}

export function toRupiahNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

export function uniqueByField(items, field, extras = []) {
  return [...extras, ...items.map((item) => item[field])]
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
}

export const INCOME_STORAGE_KEY = 'fintrack.income.v1';
export const EXPENSE_STORAGE_KEY = 'fintrack.expenses.v1';
export const BUDGET_STORAGE_KEY = 'fintrack.budgets.v1';
export const GOAL_STORAGE_KEY = 'fintrack.goals.v1';
export const SAVING_STORAGE_KEY = 'fintrack.savings.v1';
export const BILL_STORAGE_KEY = 'fintrack.bills.v1';
export const FRIEND_STORAGE_KEY = 'fintrack.friends.v1';
export const SPLIT_BILL_STORAGE_KEY = 'fintrack.splitBills.v1';
export const INVESTMENT_STORAGE_KEY = 'fintrack.investments.v1';

export function nextId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function monthLabel(dateValue = todayInputValue()) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function initials(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'FT';
}

export function categorySpending(expenses) {
  return expenses.reduce((grouped, item) => {
    grouped[item.category] = (grouped[item.category] || 0) + (Number(item.amount) || 0);
    return grouped;
  }, {});
}

export function hydrateBudgets(budgets, expenses) {
  const spending = categorySpending(expenses);
  return budgets.map((budget) => ({
    ...budget,
    spent: spending[budget.category] ?? budget.spent ?? 0,
  }));
}

export function deriveDebts(budgets, expenses) {
  return hydrateBudgets(budgets, expenses)
    .filter((budget) => budget.spent > budget.budget)
    .map((budget) => ({
      id: budget.id,
      budgetName: budget.category,
      budgetAmount: budget.budget,
      spent: budget.spent,
      debt: budget.spent - budget.budget,
      overspendPct: Math.round(((budget.spent - budget.budget) / budget.budget) * 100),
    }));
}

export function splitStatus(participants) {
  const paidCount = participants.filter((participant) => participant.paid).length;
  if (paidCount === participants.length) return 'SETTLED';
  if (paidCount > 0) return 'PARTIALLY_PAID';
  return 'PENDING';
}

export function normalizeInvestment(item) {
  return {
    ...item,
    symbol: item.symbol || item.ticker || item.name,
    name: item.name || item.symbol || item.ticker || 'Asset',
    currentValue: item.currentValue ?? item.invested ?? 0,
    invested: item.invested ?? 0,
    units: item.units || item.lots || item.amount || '',
    logoDomain: item.logoDomain || '',
    notes: item.notes || '',
  };
}
