import { IsNumber, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(['IN_PROGRESS', 'ACHIEVED', 'CANCELLED'])
  status?: 'IN_PROGRESS' | 'ACHIEVED' | 'CANCELLED';
}