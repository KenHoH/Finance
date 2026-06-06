import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'The updated amount of the transaction',
    example: 150.5,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    description: 'The updated type of the transaction',
    example: 'EXPENSE',
    enum: ['INCOME', 'EXPENSE'],
  })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({
    description: 'A brief description or note for the transaction',
    example: 'Weekly groceries',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The date of the transaction (ISO 8601 format)',
    example: '2024-05-01T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'The ID of the category this transaction belongs to',
    example: 'default-cat_12345abc',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
