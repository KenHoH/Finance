import { apiRequest, ApiError } from './api';

let categoryCache = null;

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeListResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.allData)) return response.allData;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function isOfflineError(error) {
  return error instanceof TypeError || error instanceof ApiError;
}

export async function loadFromBackend(loader, fallback) {
  try {
    const data = await loader();
    return { data, connected: true, error: null };
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    return { data: fallback, connected: false, error };
  }
}

export async function listCategories() {
  if (categoryCache) return categoryCache;
  categoryCache = normalizeListResponse(await apiRequest('/categories'));
  return categoryCache;
}

export async function ensureCategory(name, type) {
  if (!name || name === 'Overall') return undefined;
  const categories = await listCategories();
  const existing = categories.find((category) => category.name === name && category.type === type);
  if (existing) return existing.id;

  const created = await apiRequest('/categories', {
    method: 'POST',
    body: { name, type, icon: name.slice(0, 2).toUpperCase() },
  });
  categoryCache = [...categories, created];
  return created.id;
}

export async function loadTransactions(type) {
  const response = await apiRequest(`/transactions?type=${type}`);
  return normalizeListResponse(response).map((transaction) => ({
    id: transaction.id,
    date: toDateInput(transaction.date),
    description: transaction.description || '-',
    category: transaction.category?.name || 'Uncategorized',
    amount: toNumber(transaction.amount),
    source: transaction.source || 'MANUAL',
    method: transaction.source || 'Manual',
  }));
}

export async function saveTransaction(type, transaction) {
  const categoryId = await ensureCategory(transaction.category, type);
  const payload = {
    amount: toNumber(transaction.amount),
    type,
    description: transaction.description,
    date: transaction.date,
    categoryId,
    source: transaction.source || transaction.method || 'MANUAL',
  };

  const saved = transaction.id && String(transaction.id).includes('-')
    ? await apiRequest(`/transactions/${transaction.id}`, { method: 'PUT', body: payload })
    : await apiRequest('/transactions', { method: 'POST', body: payload });

  return {
    ...transaction,
    id: saved.id,
    date: toDateInput(saved.date),
    amount: toNumber(saved.amount),
    category: saved.category?.name || transaction.category,
  };
}

export async function deleteTransaction(id) {
  return apiRequest(`/transactions/${id}`, { method: 'DELETE' });
}

export async function loadBudgets() {
  const budgets = normalizeListResponse(await apiRequest('/budgets'));
  return budgets.map((budget) => ({
    id: budget.id,
    category: budget.category?.name || 'Overall',
    icon: budget.category?.icon || (budget.category?.name || 'Overall').slice(0, 2).toUpperCase(),
    budget: toNumber(budget.amount),
    spent: 0,
    period: new Date(budget.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    start: toDateInput(budget.startDate),
    end: toDateInput(budget.endDate),
    threshold: 80,
  }));
}

export async function saveBudget(budget) {
  const categoryId = await ensureCategory(budget.category, 'EXPENSE');
  const payload = {
    categoryId,
    amount: toNumber(budget.budget),
    startDate: budget.start,
    endDate: budget.end,
  };
  const saved = budget.id && String(budget.id).includes('-')
    ? await apiRequest(`/budgets/${budget.id}`, { method: 'PUT', body: payload })
    : await apiRequest('/budgets', { method: 'POST', body: payload });

  return { ...budget, id: saved.id };
}

export async function deleteBudget(id) {
  return apiRequest(`/budgets/${id}`, { method: 'DELETE' });
}

export async function loadGoals() {
  const goals = normalizeListResponse(await apiRequest('/goals'));
  return goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    target: toNumber(goal.targetAmount),
    current: toNumber(goal.currentAmount),
    deadline: toDateInput(goal.deadline),
    description: '',
    icon: 'GO',
  }));
}

export async function saveGoal(goal) {
  const payload = {
    name: goal.name,
    targetAmount: toNumber(goal.target),
    currentAmount: toNumber(goal.current),
    deadline: goal.deadline || undefined,
  };
  const saved = goal.id && String(goal.id).includes('-')
    ? await apiRequest(`/goals/${goal.id}`, { method: 'PUT', body: payload })
    : await apiRequest('/goals', { method: 'POST', body: payload });

  if (!goal.id || !String(goal.id).includes('-')) {
    return saveGoal({ ...goal, id: saved.id });
  }

  return {
    ...goal,
    id: saved.id,
    target: toNumber(saved.targetAmount),
    current: toNumber(saved.currentAmount),
    deadline: toDateInput(saved.deadline),
  };
}

export async function contributeGoal(id, amount) {
  const saved = await apiRequest(`/goals/${id}/contribute`, {
    method: 'POST',
    body: { amount: toNumber(amount) },
  });
  return {
    id: saved.id,
    name: saved.name,
    target: toNumber(saved.targetAmount),
    current: toNumber(saved.currentAmount),
    deadline: toDateInput(saved.deadline),
    description: '',
    icon: 'GO',
  };
}

export async function deleteGoal(id) {
  return apiRequest(`/goals/${id}`, { method: 'DELETE' });
}

export async function loadBills() {
  const bills = normalizeListResponse(await apiRequest('/bills'));
  return bills.map((bill) => ({
    id: bill.id,
    name: bill.title,
    amount: toNumber(bill.amount),
    frequency: 'Monthly',
    nextDue: toDateInput(bill.dueDate),
    status: String(bill.status || 'PENDING').toLowerCase(),
    category: bill.category?.name || 'Bills',
    icon: (bill.category?.name || bill.title || 'BI').slice(0, 2).toUpperCase(),
  }));
}

export async function saveBill(bill) {
  const payload = {
    title: bill.name,
    amount: toNumber(bill.amount),
    dueDate: bill.nextDue,
    isReminderEnabled: true,
  };
  const saved = bill.id && String(bill.id).includes('-')
    ? await apiRequest(`/bills/${bill.id}`, { method: 'PUT', body: payload })
    : await apiRequest('/bills', { method: 'POST', body: payload });

  return { ...bill, id: saved.id, status: String(saved.status || bill.status).toLowerCase() };
}

export async function payBackendBill(id) {
  const saved = await apiRequest(`/bills/${id}/pay`, {
    method: 'POST',
    body: { paidAt: new Date().toISOString() },
  });
  return String(saved.status || 'PAID').toLowerCase();
}

export async function deleteBill(id) {
  return apiRequest(`/bills/${id}`, { method: 'DELETE' });
}

