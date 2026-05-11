import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateInvestmentDto {
  @ApiProperty({description: 'Category ID (saham, emas, reksadana, etc)', example: 'uuid-category'})
  @IsUUID()
  categoryId: string;

  @ApiProperty({description: 'Total investment amount', example: 10000})
  @IsNumber()
  @IsPositive()
  totalAmount: number;
}
