import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateSplitBillDto {
  @ApiPropertyOptional({description: 'Updated description', example: 'Dinner at Warung Nasi (updated)'})
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({description: 'Bill status', enum: ['PENDING', 'PARTIALLY_PAID', 'SETTLED'], example: 'PARTIALLY_PAID'})
  @IsOptional()
  @IsEnum(['PENDING', 'PARTIALLY_PAID', 'SETTLED'])
  status?: 'PENDING' | 'PARTIALLY_PAID' | 'SETTLED';
}

export class UpdateParticipantDto {
  @ApiPropertyOptional({description: 'Whether participant has paid', example: true})
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}