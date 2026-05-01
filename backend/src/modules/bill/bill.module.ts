import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BillService } from './core/app/bill.service.js';
import { BillController } from './framework/bill.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
