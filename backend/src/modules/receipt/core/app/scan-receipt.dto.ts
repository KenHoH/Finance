import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScannedItemDto {
  @ApiProperty({ description: 'Item name', example: 'Nasi Goreng' })
  @IsString()
  item: string;

  @ApiProperty({ description: 'Item price', example: 25000 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Item quantity', example: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;
}

export class ConfirmReceiptDto {
  @ApiProperty({
    description: 'Scanned items to save as transactions',
    type: [ScannedItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScannedItemDto)
  items: ScannedItemDto[];

  @ApiPropertyOptional({
    description: 'Transaction date (ISO format)',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Category ID for all items',
    example: 'UUID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
