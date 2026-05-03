import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateBillDto, UpdateBillDto, PayBillDto } from '../../framework/dto/index.js';

@Injectable()
export class BillService{
  constructor(private readonly prisma: PrismaService){}

  async create(userId: string, dto: CreateBillDto){
    return this.prisma.bill.create({
      data: {
        userId,
        title: dto.title,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        categoryId: dto.categoryId ?? null,
        isReminderEnabled: dto.isReminderEnabled ?? true,
        remindAt: dto.remindAt ? new Date(dto.remindAt) : null,
        status: 'PENDING',
      },
    });
  }

  async findAll(userId: string){
    return this.prisma.bill.findMany({
      where: {userId},
      orderBy: {dueDate: 'asc'},
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.bill.findFirst({
      where: {id, userId},
    });
  }

  async update(userId: string, id: string, dto: UpdateBillDto){
    const bill = await this.prisma.bill.findFirst({
      where: {id, userId},
    });
    if(!bill) return null;

    return this.prisma.bill.update({
      where: {id},
      data: {
        title: dto.title,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        isReminderEnabled: dto.isReminderEnabled,
        remindAt: dto.remindAt ? new Date(dto.remindAt) : undefined,
      },
    });
  }

  async delete(userId: string, id: string){
    const bill = await this.prisma.bill.findFirst({
      where: {id, userId},
    });
    if(!bill) return null;

    return this.prisma.bill.delete({
      where: {id},
    });
  }

  async payBill(userId: string, id: string, dto: PayBillDto){
    const bill = await this.prisma.bill.findFirst({
      where: {id, userId},
    });
    if(!bill) return null;

    return this.prisma.bill.update({
      where: {id},
      data: {
        status: 'PAID',
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      },
    });
  }

  // Auto update overdue bills
  async checkOverdue(userId: string){
    const now = new Date();
    return this.prisma.bill.updateMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {lt: now},
      },
      data: {status: 'OVERDUE'},
    });
  }

  // Get bills needing reminder
  async getReminders(userId: string){
    const now = new Date();
    return this.prisma.bill.findMany({
      where: {
        userId,
        status: 'PENDING',
        isReminderEnabled: true,
        remindAt: {lte: now},
        paidAt: null,
      },
      orderBy: {dueDate: 'asc'},
    });
  }
}
