import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'The value for the specified key',
    example: 'daily',
  })
  @IsString()
  value: string;
}
