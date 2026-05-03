import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BudgetController } from './framework/budget.controller.js';
import { BudgetService } from './core/app/budget.service.js';
import { NotificationModule } from '../notification/notification.module.js';
import { DebtModule } from '../debt/debt.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    NotificationModule,
    DebtModule
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}