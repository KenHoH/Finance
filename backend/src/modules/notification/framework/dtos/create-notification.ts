import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  BILL_REMINDER = 'BILL_REMINDER',
  BUDGET_ALERT = 'BUDGET_ALERT',
  GOAL_UPDATE = 'GOAL_UPDATE',
  SYSTEM = 'SYSTEM',
  SPLIT_BILL_INVITE = 'SPLIT_BILL_INVITE',
  SPLIT_BILL_PAID = 'SPLIT_BILL_PAID',
  SPLIT_BILL_CONFIRMED = 'SPLIT_BILL_CONFIRMED',
  SPLIT_BILL_REJECTED = 'SPLIT_BILL_REJECTED',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'The category or template type of the notification',
    enum: NotificationType,
    example: NotificationType.BUDGET_ALERT,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'The headline or title of the notification',
    example: 'Budget Limit Reached!',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The detailed body message of the notification',
    example:
      'You have exceeded your $500 limit for the Groceries category this month.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description:
      'Whether the user has read the notification. Defaults to false.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
