import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}