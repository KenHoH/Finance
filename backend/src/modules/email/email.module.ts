import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';
import { EmailController } from './framework/email.controller.js';
import { EmailService } from './core/app/email.service.js';
import { EmailCronService } from './core/app/email-cron.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    ActivityLogModule,
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailCronService],
  exports: [EmailService],
})
export class EmailModule {}
