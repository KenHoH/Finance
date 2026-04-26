import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificationService } from '../../../notification/core/app/notification.service.js';
import { CreateTransactionDto } from './create-transaction.dto.js';
import { UpdateTransactionDto } from './update-transaction.dto.js';
import { FilterTransactionDto } from './filter-transaction.dto.js';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto){
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        isAutoTracked: dto.isAutoTracked ?? false,
        source: dto.source ?? 'MANUAL',
      },
    });

    if(transaction.type === 'EXPENSE'){
      await this.checkBudgetAlert(userId, transaction);
    }

    return transaction;
  }

  private async checkBudgetAlert(userId: string, transaction: any){
    const today = new Date();
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        startDate: {lte: today},
        endDate: {gte: today},
        ...(transaction.categoryId ? {OR: [{categoryId: transaction.categoryId}, {categoryId: null}]} : {categoryId: null}),
      },
      include: {category: true},
    });

    for(const budget of budgets){
      const spentAgg = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: {gte: budget.startDate, lte: budget.endDate},
          ...(budget.categoryId ? {categoryId: budget.categoryId} : {}),
        },
        _sum: {amount: true},
      });

      const spent = Number(spentAgg._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

      const categoryName = budget.category?.name ?? 'Overall';

      if(percentage >= 100){
        await this.notificationService.create(
          userId,
          'BUDGET_ALERT',
          'Budget Exceeded',
          `You have exceeded your ${categoryName} budget of Rp ${budgetAmount.toLocaleString('id-ID')}. Current spending: Rp ${spent.toLocaleString('id-ID')}`,
        );
      }else if(percentage >= 80){
        await this.notificationService.create(
          userId,
          'BUDGET_ALERT',
          'Budget Warning',
          `You have used ${percentage}% of your ${categoryName} budget (Rp ${budgetAmount.toLocaleString('id-ID')})`,
        );
      }
    }
  }

  async findAll(userId: string, filters?: FilterTransactionDto){
    const where: any = { userId };

    if(filters?.type){
      where.type = filters.type;
    }

    if(filters?.categoryId){
      where.categoryId = filters.categoryId;
    }

    if(filters?.startDate || filters?.endDate){
      where.date = {};
      if(filters.startDate) where.date.gte = new Date(filters.startDate);
      if(filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const page = Math.max(1, parseInt(filters?.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filters?.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: {date: 'desc'},
        include: {category: true},
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string){
    return this.prisma.transaction.findFirst({
      where: {id, userId},
      include: {category: true},
    });
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto){
    const transaction = await this.prisma.transaction.findFirst({
      where: {id, userId},
    });

    if(!transaction) return null;

    return this.prisma.transaction.update({
      where: {id},
      data: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        categoryId: dto.categoryId,
      },
    });
  }

  async delete(userId: string, id: string){
    const transaction = await this.prisma.transaction.findFirst({
      where: {id, userId},
    });

    if(!transaction) return null;

    return this.prisma.transaction.delete({
      where: {id},
    });
  }
}