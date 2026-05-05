import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateBillDto, UpdateBillDto, PayBillDto } from '../../framework/dto/index.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';

@Injectable()
export class BillService{
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ){}

  async create(userId: string, dto: CreateBillDto){
    const bill = await this.prisma.bill.create({
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

    await this.activityLogService.logActivity(userId, 'CREATE', 'Bill', bill.id, {title: bill.title, amount: Number(bill.amount)});

    return bill;
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

    const updated = await this.prisma.bill.update({
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

    await this.activityLogService.logActivity(userId, 'UPDATE', 'Bill', id, {title: updated.title, amount: Number(updated.amount)});

    return updated;
  }

  async delete(userId: string, id: string){
    const bill = await this.prisma.bill.findFirst({
      where: {id, userId},
    });
    if(!bill) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'Bill', id);

    return this.prisma.bill.delete({
      where: {id},
    });
  }

  async payBill(userId: string, id: string, dto: PayBillDto){
    const bill = await this.prisma.bill.findFirst({
      where: {id, userId},
    });
    if(!bill) return null;

    const paid = await this.prisma.bill.update({
      where: {id},
      data: {
        status: 'PAID',
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      },
    });

    await this.activityLogService.logActivity(userId, 'PAY', 'Bill', id, {title: paid.title, amount: Number(paid.amount)});

    return paid;
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
