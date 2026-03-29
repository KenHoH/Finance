import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

// create-budget.dto.ts
export class CreateBudgetDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}