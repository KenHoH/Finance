import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAllocationDto {
  @ApiProperty({description: 'Category ID to allocate to', example: 'uuid-category'})
  @IsUUID()
  categoryId: string;

  @ApiProperty({description: 'Allocation amount', example: 1000})
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({description: 'Allocation date', example: '2025-05-01'})
  @IsDateString()
  allocationDate: string;

  @ApiPropertyOptional({description: 'Optional note', example: 'Monthly investment'})
  @IsOptional()
  @IsString()
  note?: string;
}
