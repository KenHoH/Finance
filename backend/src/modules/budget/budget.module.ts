import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BudgetController } from './framework/budget.controller.js';
import { BudgetService } from './core/app/budget.service.js';
import { NotificationModule } from '../notification/notification.module.js';
import { DebtModule } from '../debt/debt.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    NotificationModule,
    SettingsModule,
    DebtModule,
    ActivityLogModule
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}