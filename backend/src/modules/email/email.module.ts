import { Module } from '@nestjs/common';
import { EmailController } from './framework/email.controller.js';
import { EmailService } from './core/app/email.service.js';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
