import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  ValidateIf,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSplitBillItemDto {
  @ApiProperty({ description: 'Item name', example: 'Nasi Goreng' })
  @IsString()
  item: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsInt()
  quantity: number;

  @ApiProperty({ description: 'Price per unit', example: 25000 })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'User IDs of participants assigned to this item',
    example: ['user-id-1', 'user-id-2'],
  })
  @IsArray()
  @IsString({ each: true })
  assignedTo: string[];
}

export class CreateParticipantDto {
  @ValidateIf((o: CreateParticipantDto) => !o.name)
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Name if unregistered user',
    example: 'John Doe',
  })
  @ValidateIf((o: CreateParticipantDto) => !o.userId)
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Amount this participant owes (optional if items provided)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  amountOwed?: number;
}

export class CreateSplitBillDto {
  @ApiProperty({ description: 'Total bill amount', example: 150000 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({
    description: 'Bill description',
    example: 'Dinner at Warung Nasi',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Bill date', example: '2026-04-26' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Receipt image URL from OCR upload',
    example: 'https://...',
  })
  @IsOptional()
  @IsString()
  receiptImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Items with participant assignments',
    type: [CreateSplitBillItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSplitBillItemDto)
  items?: CreateSplitBillItemDto[];

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 10 })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Service charge rate percentage',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  serviceChargeRate?: number;

  @ApiPropertyOptional({
    description: 'Discount amount in IDR',
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiProperty({
    description: 'Participants to split with',
    type: [CreateParticipantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];
}
