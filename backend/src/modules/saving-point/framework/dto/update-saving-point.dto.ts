import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateSavingPointDto {
  @ApiPropertyOptional({ description: 'Update saving amount', example: 1000 })
  @IsOptional()
  @IsNumber()
  savingAmount?: number;
}
