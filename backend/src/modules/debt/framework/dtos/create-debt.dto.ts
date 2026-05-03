import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDebtDto {
  @ApiProperty({
    description: 'The unique identifier of the budget this debt is associated with',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  budgetId: string;

  @ApiProperty({
    description: 'The total overbudget amount (debt) for this specific budget cycle',
    example: 150.50,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  debtAmount: number;
}