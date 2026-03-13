import { Module } from '@nestjs/common';
import { AuthController } from './framework/auth.controller.js';
import { AuthService } from './core/app/auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
