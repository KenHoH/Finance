import { Module } from '@nestjs/common';
import { EmailController } from './framework/email.controller';
import { EmailService } from './core/app/email.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
