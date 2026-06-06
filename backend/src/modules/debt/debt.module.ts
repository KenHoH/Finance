import { Module } from '@nestjs/common';
import { DebtController } from './framework/debt.controller.js';
import { DebtService } from './core/app/debt.service.js';
import { ConfigService } from '@nestjs/config/dist/index.js';
import { JwtModule } from '@nestjs/jwt/dist/index.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DebtController],
  providers: [DebtService],
  exports: [DebtService],
})
export class DebtModule {}
