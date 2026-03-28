import { Module } from '@nestjs/common';
import { AuthController } from './framework/auth.controller.js';
import { AuthService } from './core/app/auth.service.js';
import { GoogleOauthService } from './core/app/google-oauth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {expiresIn: '7d'},
      }),
      inject: [ConfigService]
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, GoogleOauthService],
})
export class AuthModule {}
