import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateSplitBillDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'PARTIALLY_PAID', 'SETTLED'])
  status?: 'PENDING' | 'PARTIALLY_PAID' | 'SETTLED';
}

export class UpdateParticipantDto {
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}