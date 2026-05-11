import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class UpdateDebtDto {
  @ApiPropertyOptional({
    description: 'The updated total debt amount for the associated budget. This represents the amount spent over the budget limit.',
    example: 125.50,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Debt amount cannot be negative' })
  debtAmount?: number;

  @ApiPropertyOptional({
    description: 'The unique UUID version 4 identifier of the budget. Typically only included if business logic permits reassigning a debt point to a different budget.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'budgetId must be a valid UUID' })
  budgetId?: string;
}