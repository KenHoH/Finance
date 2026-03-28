export class UpdateTransactionDto {
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  description?: string;
  date?: string;
  categoryId?: string;
}