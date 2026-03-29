export class CreateCategoryDto {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
}