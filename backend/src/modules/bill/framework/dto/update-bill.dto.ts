import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class UpdateBillDto {
  @ApiPropertyOptional({ description: 'Bill title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ['PENDING', 'PAID', 'OVERDUE'],
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'OVERDUE'])
  status?: 'PENDING' | 'PAID' | 'OVERDUE';

  @ApiPropertyOptional({ description: 'Enable reminder' })
  @IsOptional()
  @IsBoolean()
  isReminderEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Reminder time' })
  @IsOptional()
  @IsDateString()
  remindAt?: string;
}
