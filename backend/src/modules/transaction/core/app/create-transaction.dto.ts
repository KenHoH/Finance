export class CreateTransactionDto {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  date: string;
  categoryId?: string;
  isAutoTracked?: boolean;
  source?: string;
}