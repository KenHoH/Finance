import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID, IsOptional, IsString } from 'class-validator';

export class PayDebtDto {
  @ApiProperty({description: 'DebtPoint ID to pay', example: 'uuid-of-debt-point'})
  @IsUUID()
  debtPointId: string;

  @ApiProperty({description: 'Amount to pay toward debt', example: 100})
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({description: 'Optional note', example: 'Budget surplus payment', required: false})
  @IsOptional()
  @IsString()
  note?: string;
}
