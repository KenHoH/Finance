import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SavingPointService } from './core/app/saving-point.service.js';
import { SavingPointController } from './framework/saving-point.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SavingPointController],
  providers: [SavingPointService],
  exports: [SavingPointService],
})
export class SavingPointModule {}
