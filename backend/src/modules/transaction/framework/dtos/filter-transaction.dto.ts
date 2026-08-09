import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsNumberString,
} from 'class-validator';

export class FilterTransactionDto {
  @ApiPropertyOptional({
    description: 'Filter transactions by type',
    example: 'EXPENSE',
    enum: ['INCOME', 'EXPENSE'],
  })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({
    description: 'Filter by a specific category ID',
    example: 'cat_12345abc',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering transactions (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering transactions (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'The ID of the last transaction from the previous page for cursor-based pagination',
    example: 'txn_987xyz',
  })
  @IsOptional()
  @IsString()
  cursorId?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of transactions to return per page',
    example: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
