import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateSplitBillDto {
  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'Dinner at Warung Nasi (updated)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Bill status',
    enum: ['PENDING', 'PARTIALLY_PAID', 'SETTLED'],
    example: 'PARTIALLY_PAID',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PARTIALLY_PAID', 'SETTLED'])
  status?: 'PENDING' | 'PARTIALLY_PAID' | 'SETTLED';
}

export class UpdateParticipantDto {
  @ApiPropertyOptional({
    description: 'Participant status',
    enum: ['PENDING', 'PAID_PENDING_CONFIRMATION', 'CONFIRMED'],
    example: 'PAID_PENDING_CONFIRMATION',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID_PENDING_CONFIRMATION', 'CONFIRMED'])
  status?: 'PENDING' | 'PAID_PENDING_CONFIRMATION' | 'CONFIRMED';

  @ApiPropertyOptional({
    description: 'Rejection reason when creator rejects payment',
    example: 'Amount mismatch',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Notes about this participant payment',
    example: 'Paid cash in person',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
