export interface BudgetDetail {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  spent: number;
  remaining: number;
  percentage: number;
  status: string;
}

export interface AggregatedBudget {
  category: { id: string; name: string; icon: string | null } | null;
  totalAmount: number;
  startDate: string;
  endDate: string;
  spent: number;
  remaining: number;
  percentage: number;
  status: string;
  budgets: BudgetDetail[];
}

export interface CreateBudgetInput {
  amount: number;
  startDate: string;
  endDate: string;
  categoryId?: string;
}

export interface UpdateBudgetInput {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
}
