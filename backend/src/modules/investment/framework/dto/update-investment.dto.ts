import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateInvestmentDto {
  @ApiPropertyOptional({ description: 'Update total amount', example: 15000 })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;
}
