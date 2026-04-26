import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

// create-budget.dto.ts
export class CreateBudgetDto {
  @ApiPropertyOptional({description: 'Category ID (optional)', example: 'default-salary'})
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({description: 'Budget amount limit', example: 1000})
  @IsNumber()
  amount: number;

  @ApiProperty({description: 'Budget period start date', example: '2025-01-01'})
  @IsDateString()
  startDate: string;

  @ApiProperty({description: 'Budget period end date', example: '2025-01-31'})
  @IsDateString()
  endDate: string;
}