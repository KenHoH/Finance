import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterActivityLogDto{
  @ApiPropertyOptional({example: 'Transaction', description: 'Filter by entity'})
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({example: 'CREATE', description: 'Filter by action'})
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({example: 1, description: 'Page number'})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({example: 20, description: 'Items per page'})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
