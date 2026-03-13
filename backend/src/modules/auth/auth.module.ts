import { Module } from '@nestjs/common';
import { AuthController } from './framework/auth.controller.js';
import { AuthService } from './core/app/auth.service.js';
import { GoogleOauthService } from './core/app/google-oauth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleOauthService],
})
export class AuthModule {}
