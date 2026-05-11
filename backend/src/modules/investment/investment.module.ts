import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvestmentService } from './core/app/investment.service.js';
import { InvestmentController } from './framework/investment.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';

@Module({
  imports: [PrismaModule, JwtModule.register({}), ActivityLogModule],
  controllers: [InvestmentController],
  providers: [InvestmentService],
  exports: [InvestmentService],
})
export class InvestmentModule {}
