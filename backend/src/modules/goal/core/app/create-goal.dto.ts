import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  name: string;

  @IsNumber()
  targetAmount: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}