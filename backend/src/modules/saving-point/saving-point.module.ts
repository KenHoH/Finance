import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SavingPointService } from './core/app/saving-point.service.js';
import { SavingPointController } from './framework/saving-point.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ActivityLogModule } from '../activity-log/activity-log.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';

@Module({
  imports: [PrismaModule, JwtModule.register({}), ActivityLogModule, TransactionModule],
  controllers: [SavingPointController],
  providers: [SavingPointService],
  exports: [SavingPointService],
})
export class SavingPointModule {}
