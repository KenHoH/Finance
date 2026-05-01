import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'The display name of the category',
    example: 'Groceries',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'The financial classification of the category',
    enum: ['INCOME', 'EXPENSE'],
    example: 'EXPENSE',
  })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({
    description: 'A visual identifier, emoji, or icon key used in the UI for this category',
    example: 'icon-a', 
  })
  @IsOptional()
  @IsString()
  icon?: string;
}