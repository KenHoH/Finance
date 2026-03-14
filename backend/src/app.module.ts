import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { AppService } from './app.service.js'
import { AppController } from './app.controller.js';
import { EmailModule } from './modules/email/email.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, EmailModule, ConfigModule.forRoot({
    envFilePath: '.env',
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
