import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateSavingPointDto {
  @ApiProperty({
    description: 'Budget ID to link this saving point',
    example: 'uuid-of-budget',
  })
  @IsUUID()
  budgetId: string;

  @ApiProperty({ description: 'Initial saving amount', example: 500 })
  @IsNumber()
  @IsPositive()
  savingAmount: number;
}
