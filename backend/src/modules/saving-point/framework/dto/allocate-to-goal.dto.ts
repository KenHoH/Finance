import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class AllocateToGoalDto {
  @ApiProperty({
    description: 'Goal ID to allocate to',
    example: 'uuid-of-goal',
  })
  @IsUUID()
  goalId: string;

  @ApiProperty({ description: 'Amount to allocate', example: 100 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Optional note',
    example: 'Monthly allocation',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
