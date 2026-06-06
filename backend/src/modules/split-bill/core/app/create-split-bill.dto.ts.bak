import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateParticipantDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({description: 'Name if unregistered user', example: 'John Doe'})
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({description: 'Amount this participant owes', example: 50000})
  @IsNumber()
  amountOwed: number;
}

export class CreateSplitBillDto {
  @ApiProperty({description: 'Total bill amount', example: 150000})
  @IsNumber()
  totalAmount: number;

  @ApiProperty({description: 'Bill description', example: 'Dinner at Warung Nasi'})
  @IsString()
  description: string;

  @ApiProperty({description: 'Bill date', example: '2026-04-26'})
  @IsDateString()
  date: string;

  @ApiProperty({description: 'Participants to split with', type: [CreateParticipantDto]})
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];
}