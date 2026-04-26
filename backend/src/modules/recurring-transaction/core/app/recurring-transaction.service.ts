import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateRecurringTransactionDto } from './create-recurring-transaction.dto.js';
import { UpdateRecurringTransactionDto } from './update-recurring-transaction.dto.js';

@Injectable()
export class RecurringTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurringTransactionDto){
    const startDate = new Date(dto.startDate);
    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type as any,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        frequency: dto.frequency as any,
        startDate,
        nextDate: startDate,
        isActive: dto.isActive ?? true,
      },
      include: {category: true},
    });
  }

  async findAll(userId: string){
    return this.prisma.recurringTransaction.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
      include: {category: true},
    });
  }

  async findAllActive(userId: string){
    return this.prisma.recurringTransaction.findMany({
      where: {userId, isActive: true},
      orderBy: {nextDate: 'asc'},
      include: {category: true},
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.recurringTransaction.findFirst({
      where: {id, userId},
      include: {category: true},
    });
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto){
    const recurring = await this.prisma.recurringTransaction.findFirst({
      where: {id, userId},
    });

    if(!recurring) return null;

    return this.prisma.recurringTransaction.update({
      where: {id},
      data: {
        amount: dto.amount,
        type: dto.type as any,
        description: dto.description,
        categoryId: dto.categoryId,
        frequency: dto.frequency as any,
        nextDate: dto.nextDate ? new Date(dto.nextDate) : undefined,
        isActive: dto.isActive,
      },
      include: {category: true},
    });
  }

  async delete(userId: string, id: string){
    const recurring = await this.prisma.recurringTransaction.findFirst({
      where: {id, userId},
    });

    if(!recurring) return null;

    return this.prisma.recurringTransaction.delete({
      where: {id},
    });
  }

  async processDueRecurring(){
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueRecurring = await this.prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDate: {lte: today},
      },
    });

    const results: {recurringId: string; transactionId: string; nextDate: Date}[] = [];
    for(const recurring of dueRecurring){
      const transaction = await this.prisma.transaction.create({
        data: {
          userId: recurring.userId,
          categoryId: recurring.categoryId,
          amount: recurring.amount,
          type: recurring.type,
          description: `${recurring.description} (Recurring)`,
          date: recurring.nextDate,
          isAutoTracked: true,
          source: 'RECURRING',
        },
      });

      const nextDate = this.calculateNextDate(recurring.nextDate, recurring.frequency as string);
      await this.prisma.recurringTransaction.update({
        where: {id: recurring.id},
        data: {nextDate},
      });

      results.push({recurringId: recurring.id, transactionId: transaction.id, nextDate});
    }

    return results;
  }

  private calculateNextDate(currentDate: Date, frequency: string): Date{
    const date = new Date(currentDate);
    switch(frequency){
      case 'DAILY':
        date.setDate(date.getDate() + 1);
        break;
      case 'WEEKLY':
        date.setDate(date.getDate() + 7);
        break;
      case 'BIWEEKLY':
        date.setDate(date.getDate() + 14);
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date;
  }
}
