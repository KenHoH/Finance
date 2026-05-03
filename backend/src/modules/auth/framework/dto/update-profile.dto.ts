import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({description: 'New username for the user', example: 'John Doe', required: false})
  @IsOptional()
  @IsString()
  @MinLength(1)
  username?: string;
}
