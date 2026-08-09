import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateActivityLogDto {
  @ApiProperty({ example: 'CREATE', description: 'Action type' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'Transaction', description: 'Entity type' })
  @IsString()
  entity: string;

  @ApiPropertyOptional({
    example: 'uuid-123',
    description: 'Entity ID affected',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    example: '{"amount": 100}',
    description: 'JSON details',
  })
  @IsOptional()
  @IsString()
  details?: string;
}
