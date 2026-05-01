import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({description: 'Category name', example: 'Food & Dining'})
  @IsString()
  name: string;

  @ApiProperty({description: 'Category type', enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE'})
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({description: 'Icon identifier', example: 'restaurant'})
  @IsOptional()
  @IsString()
  icon?: string;
}