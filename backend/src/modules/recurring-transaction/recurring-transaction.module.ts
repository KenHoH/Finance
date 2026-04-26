import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringTransactionController } from './framework/recurring-transaction.controller.js';
import { RecurringTransactionService } from './core/app/recurring-transaction.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RecurringTransactionCron } from './core/app/recurring-transaction.cron.js';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RecurringTransactionController],
  providers: [RecurringTransactionService, RecurringTransactionCron],
  exports: [RecurringTransactionService],
})
export class RecurringTransactionModule {}
