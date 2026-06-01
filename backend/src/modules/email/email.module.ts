import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';
import { EmailController } from './framework/email.controller.js';
import { EmailService } from './core/app/email.service.js';
import { EmailCronService } from './core/app/email-cron.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';

@Module({
  imports: [JwtModule.register({}), PrismaModule, ActivityLogModule, forwardRef(() => AuthModule), TransactionModule],
  controllers: [EmailController],
  providers: [EmailService, EmailCronService],
  exports: [EmailService],
})
export class EmailModule {}
