import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingsDto {
  @ApiProperty({
    description: 'The specific setting key being configured',
    example: 'BUDGET_TIME_PREFERENCE',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'The value for the setting. Stored as a string, but can represent booleans, numbers, or JSON depending on the key.',
    example: 'monthly', 
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}