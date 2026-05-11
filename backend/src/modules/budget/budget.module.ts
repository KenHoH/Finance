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

function redisConnection(configService: ConfigService) {
  const redisUrl = configService.get<string>('REDIS_URL');
  if(redisUrl){
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: configService.get<string>('REDIS_HOST') || 'localhost',
    port: Number(configService.get<string>('REDIS_PORT') || 6379),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    tls: configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
  };
}

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: redisConnection(configService),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'saving',
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
