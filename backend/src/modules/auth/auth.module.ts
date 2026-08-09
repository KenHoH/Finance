import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './framework/auth.controller.js';
import { AuthService } from './core/app/auth.service.js';
import { GoogleOauthService } from './core/app/google-oauth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => EmailModule),
  ],
  exports: [GoogleOauthService, AuthService],
  controllers: [AuthController],
  providers: [AuthService, GoogleOauthService],
})
export class AuthModule {}
