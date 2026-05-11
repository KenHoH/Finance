import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({description: 'Goal name', example: 'New Laptop'})
  @IsString()
  name: string;

  @ApiProperty({description: 'Target savings amount', example: 1500})
  @IsNumber()
  targetAmount: number;

  @ApiPropertyOptional({description: 'Goal deadline (optional)', example: '2025-06-01'})
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
