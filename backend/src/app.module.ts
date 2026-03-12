import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { EmailController } from './modules/email/framework/email.controller.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [AuthModule, EmailController],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
