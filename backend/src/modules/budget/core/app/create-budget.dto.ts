// create-budget.dto.ts
export class CreateBudgetDto {
  categoryId?: string;
  amount: number;
  startDate: string;
  endDate: string;
}