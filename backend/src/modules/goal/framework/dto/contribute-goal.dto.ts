import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString, IsUUID } from 'class-validator';

export class ContributeGoalDto {
  @ApiProperty({description: 'Contribution amount', example: 100})
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({description: 'Optional SavingPoint ID to use as source', example: 'uuid-of-saving-point'})
  @IsOptional()
  @IsUUID()
  savingPointId?: string;

  @ApiPropertyOptional({description: 'Optional note for this contribution', example: 'Monthly savings'})
  @IsOptional()
  @IsString()
  note?: string;
}
