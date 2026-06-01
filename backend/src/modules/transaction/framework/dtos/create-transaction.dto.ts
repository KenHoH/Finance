import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({description: 'Transaction amount', example: 100.50})
  @IsNumber()
  amount: number;

  @ApiProperty({description: 'Transaction type', enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE'})
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({description: 'Transaction description', example: 'Grocery shopping'})
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({description: 'Transaction date (ISO format)', example: '2025-01-15'})
  @IsDateString()
  date: string;
  @ApiPropertyOptional({description: 'Category ID (optional)', example: 'UUID'})
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({description: 'Whether the transaction is auto-tracked', example: true})
  @IsOptional()
  @IsBoolean()
  isAutoTracked?: boolean;

  @ApiPropertyOptional({description: 'Transaction source', example: 'Bank account'})
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({description: 'Transaction source ID', example: 'source-123'})
  @IsOptional()
  @IsString()
  sourceId?: string;
}