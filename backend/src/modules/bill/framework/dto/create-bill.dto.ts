import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateBillDto {
  @ApiProperty({description: 'Bill title', example: 'Electricity Bill'})
  @IsString()
  title: string;

  @ApiProperty({description: 'Amount to pay', example: 150.50})
  @IsNumber()
  amount: number;

  @ApiProperty({description: 'Due date (ISO date)', example: '2025-05-15'})
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({description: 'Category ID', example: 'uuid-category'})
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({description: 'Enable reminder', example: true})
  @IsOptional()
  @IsBoolean()
  isReminderEnabled?: boolean;

  @ApiPropertyOptional({description: 'Reminder time', example: '2025-05-14T09:00:00Z'})
  @IsOptional()
  @IsDateString()
  remindAt?: string;
}
