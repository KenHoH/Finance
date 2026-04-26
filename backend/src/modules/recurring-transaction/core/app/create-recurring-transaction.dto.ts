import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateRecurringTransactionDto {
  @ApiProperty({description: 'Recurring amount', example: 50.00})
  @IsNumber()
  amount: number;

  @ApiProperty({description: 'Transaction type', enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE'})
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty({description: 'Transaction description', example: 'Monthly rent'})
  @IsString()
  description: string;

  @ApiPropertyOptional({description: 'Category ID (optional)', example: 'default-salary'})
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({description: 'How often this repeats', enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'], example: 'MONTHLY'})
  @IsEnum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @ApiProperty({description: 'When the recurring series starts', example: '2025-01-01'})
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({description: 'Whether this is active', example: true})
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
