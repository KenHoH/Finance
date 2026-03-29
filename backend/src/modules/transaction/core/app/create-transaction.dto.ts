import { IsNumber, IsEnum, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isAutoTracked?: boolean;

  @IsOptional()
  @IsString()
  source?: string;
}