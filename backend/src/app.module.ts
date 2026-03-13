import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { AppService } from './app.service.js'
import { AppController } from './app.controller.js';
import { EmailModule } from './modules/email/email.module.js';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
