import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class PayBillDto {
  @ApiPropertyOptional({description: 'Payment date (default: now)', example: '2025-05-10T10:00:00Z'})
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
