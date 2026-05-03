import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateGoalDto {
  @ApiPropertyOptional({description: 'Goal name'})
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({description: 'Target amount'})
  @IsOptional()
  @IsNumber()
  targetAmount?: number;

  @ApiPropertyOptional({description: 'Current amount'})
  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @ApiPropertyOptional({description: 'Deadline (ISO date string)'})
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({description: 'Goal status', enum: ['IN_PROGRESS', 'ACHIEVED', 'CANCELLED']})
  @IsOptional()
  @IsEnum(['IN_PROGRESS', 'ACHIEVED', 'CANCELLED'])
  status?: 'IN_PROGRESS' | 'ACHIEVED' | 'CANCELLED';
}
