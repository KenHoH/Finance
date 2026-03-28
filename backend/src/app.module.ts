import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { AppService } from './app.service.js'
import { AppController } from './app.controller.js';
import { EmailModule } from './modules/email/email.module.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module.js';

@Module({
  imports: [AuthModule, EmailModule, PrismaModule, ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
