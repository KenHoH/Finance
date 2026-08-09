import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateInvestmentDto {
  @ApiProperty({
    description: 'Category ID (saham, emas, reksadana, etc)',
    example: 'investment-stocks',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Total investment amount', example: 10000 })
  @IsNumber()
  @IsPositive()
  totalAmount: number;
}
