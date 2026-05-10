import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificationService } from '../../../notification/core/app/notification.service.js';
import { CreateTransactionDto } from '../../framework/dtos/create-transaction.dto.js';
import { UpdateTransactionDto } from '../../framework/dtos/update-transaction.dto.js';
import { FilterTransactionDto } from '../../framework/dtos/filter-transaction.dto.js';
import { Prisma } from 'generated/prisma/client.js'; // browser.js itu buat front, pakaii client.js baru bisa konek db
import { BudgetService } from '../../../budget/core/app/budget.service.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly budgetService: BudgetService,
    private readonly activityLogService: ActivityLogService,
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
        sourceId: dto.sourceId,
      },
    });

    if(transaction.type === 'EXPENSE'){
      await this.budgetService.checkBudgetOverall(userId, transaction);
    }

    await this.activityLogService.logActivity(userId, 'CREATE', 'Transaction', transaction.id, {amount: Number(transaction.amount), type: transaction.type});

    return transaction;
  }

  public async getTotalSpentByDay(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      _sum: {amount: true},
    });
    return Number(result._sum.amount || 0);
  }

  public async getTotalSpentByDayByCategory(userId: string, categoryId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        categoryId: categoryId,
      },
      _sum: {amount: true},
    });
    return Number(result._sum.amount || 0);
  }


  public async getTotalSpentThisMonth(userId: string, startDate: string, endDate: string) : Promise<number> {

    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {amount: true},
    });
    return Number(result._sum.amount || 0);
  }

  public async getTotalSpentThisMonthByCategory(userId: string, categoryId: string, startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: start,
          lt: end,
        },
        categoryId: categoryId,
      },
      _sum: {amount: true},
    });
    return Number(result._sum.amount || 0);
  }

  /**
   *  UNUSED function replaced by budgetService checkBudgetOverall 
   */
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
      // total spent in the budget period and category
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
    const where: Prisma.TransactionWhereInput = { userId };

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

    const cursorId = filters?.categoryId;
    const limit = Number(filters?.limit);

    if (limit == undefined || cursorId == undefined) {
      const allData = await this.prisma.transaction.findMany( {
        where: {
          userId: userId
        }
      })
      return {
        allData,
        cursor: undefined
      }
    }

    const data = await this.prisma.transaction.findMany({
    where: { userId },
    take: limit,
    ...(cursorId && {
      skip: 1, 
      cursor: { id: cursorId },
    }),
    orderBy: { date: 'desc' },
  });

    const nextCursor = data.length === limit ? data[data.length - 1].id : null;
    return {
      data: data,
      cursor: nextCursor,
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

    const updated = await this.prisma.transaction.update({
      where: {id},
      data: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        categoryId: dto.categoryId,
      },
    });

    await this.activityLogService.logActivity(userId, 'UPDATE', 'Transaction', id, {amount: Number(updated.amount), type: updated.type});

    return updated;
  }

  async delete(userId: string, id: string){
    const transaction = await this.prisma.transaction.findFirst({
      where: {id, userId},
    });

    if(!transaction) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'Transaction', id);

    return this.prisma.transaction.delete({
      where: {id},
    });
  }
}