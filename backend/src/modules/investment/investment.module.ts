import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InvestmentService } from './core/app/investment.service.js';
import { InvestmentController } from './framework/investment.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ActivityLogModule,
  ],
  controllers: [InvestmentController],
  providers: [InvestmentService],
  exports: [InvestmentService],
})
export class InvestmentModule {}
