import { Module } from '@nestjs/common';
import { SettingsController } from './framework/settings.controller.js';
import { SettingsService } from './core/app/settings.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config/dist/index.js';
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService]
})
export class SettingsModule {}
