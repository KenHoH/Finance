import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID, IsOptional, IsString } from 'class-validator';

export class AllocateToInvestmentDto {
  @ApiProperty({description: 'Category ID of investment to allocate to', example: 'uuid-of-investment-category'})
  @IsUUID()
  categoryId: string;

  @ApiProperty({description: 'Amount to allocate', example: 100})
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({description: 'Optional note', example: 'Budget surplus allocation', required: false})
  @IsOptional()
  @IsString()
  note?: string;
}
