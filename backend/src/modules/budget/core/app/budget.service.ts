import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateBudgetDto } from '../../framework/dtos/create-budget.dto.js';
import { UpdateBudgetDto } from '../../framework/dtos/update-budget.dto.js';
import { NotificationService } from '../../../notification/core/app/notification.service.js';
import { DebtService } from '../../../debt/core/app/debt.service.js';
import { SettingsService } from '../../../settings/core/app/settings.service.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly debtService: DebtService,
    private readonly settingsService: SettingsService,
    private readonly activityLogService: ActivityLogService,
    @InjectQueue('saving') private readonly savingQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateBudgetDto){
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId ?? undefined,
        amount: dto.amount,
        startDate,
        endDate,
      },
      include: {category: true},
    });

    await this.activityLogService.logActivity(userId, 'CREATE', 'Budget', budget.id, {amount: Number(budget.amount)});

    const settings = await this.settingsService.findOneByKey(userId, 'BUDGET_TIME_PREFERENCE');

    const userPreference = settings?.value ?? 'daily';

    if(userPreference !== 'daily'){
      const delay = endDate.getTime() - Date.now();

      await this.savingQueue.add('calculate', { budgetId: budget.id, userId: userId, startDate: dto.startDate, endDate: dto.endDate }, {
        delay: delay,
        jobId: `saving-${budget.id}`,
      });
    }
    return budget;
  }

  // find all budgets created by the user 
  async findAll(userId: string){
    return this.prisma.budget.findMany({
      where: {userId},
      orderBy: {startDate: 'desc'},
      include: {category: true},
    });
  }

  // find budget created by the user with the given id
  async findOne(userId: string, id: string){
    return this.prisma.budget.findFirst({
      where: {id, userId},
      include: {category: true},
    });
  }

  // update budget created by the user with the given id
  async update(userId: string, id: string, dto: UpdateBudgetDto){
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId},
    });

    if(!budget) return null;

    const startDate = dto.startDate ? new Date(dto.startDate) : budget.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : budget.endDate;

    const updated = await this.prisma.budget.update({
      where: {id},
      data: {
        amount: dto.amount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {category: true},
    });

    await this.activityLogService.logActivity(userId, 'UPDATE', 'Budget', id, {amount: Number(updated.amount)});

    return updated;
  }

  async delete(userId: string, id: string){
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId},
    });

    if(!budget) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'Budget', id);

    return this.prisma.budget.delete({
      where: {id},
    });
  }

  // get daily budget value 
  // returns dailyBudget and number of days in the budget period
  async getDailyBudget(userId: string, id: string){
    // find the budget for one month (data with no category reference)
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId, categoryId: null},
    });

    if(!budget) return null;

    // calculate daily budget by the budget start and end date and the amount 
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const dailyBudget = Number(budget.amount) / days;

    return {
      id: budget.id,
      dailyBudget,
      days,
    };
  }

  // get budget per category (all category that the user have)
  async getBudgetPerCategory(userId: string){
    // find the all the budget that have category reference (data with category reference) owned by the user
    const budgets = await this.prisma.budget.findMany({
      where: {userId, categoryId: {not: null}},
      include: {category: true},
    });

    if(!budgets) return null;

    return budgets.map(budget => ({
      id: budget.id,
      amount: Number(budget.amount),
      startDate: budget.startDate,
      endDate: budget.endDate,
      categoryId: budget.categoryId,
      category: budget.category,
    }));
  }

  // get daily budget per category 
  async getDailyBudgetPerCategory(userId: string, id: string){
    // find the budget for one month (data with category reference)
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId, categoryId: {not: null}},
      include: {category: true},
    });

    if(!budget) return null;

    // calculate daily budget by the budget start and end date and the amount 
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const dailyBudget = Number(budget.amount) / days;

    return {
      id: budget.id,
      dailyBudget,
      days,
      categoryId: budget.categoryId,
      category: budget.category,
    };
  }

  // aggregate function 
  private getBudgetDurationDays(startDate: Date, endDate: Date): number{
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private budgetsOverlap(a: any, b: any): boolean{
    return a.startDate <= b.endDate && a.endDate >= b.startDate;
  }

  private async calculateSpentForBudget(userId: string, budget: any, allBudgets: any[]): Promise<number>{
    const budgetDuration = this.getBudgetDurationDays(budget.startDate, budget.endDate);

    const shorterOverlaps = allBudgets.filter((b) => {
      if(b.id === budget.id) return false;
      if(!this.budgetsOverlap(budget, b)) return false;
      const bDuration = this.getBudgetDurationDays(b.startDate, b.endDate);
      if(bDuration >= budgetDuration) return false;
      // Shorter budget can steal if its category matches the transaction scope
      return b.categoryId === budget.categoryId || b.categoryId === null || budget.categoryId === null;
    });

    if(shorterOverlaps.length === 0){
      const agg = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: {gte: budget.startDate, lte: budget.endDate},
          ...(budget.categoryId ? {categoryId: budget.categoryId} : {}),
        },
        _sum: {amount: true},
      });
      return Number(agg._sum.amount || 0);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {gte: budget.startDate, lte: budget.endDate},
        ...(budget.categoryId ? {categoryId: budget.categoryId} : {}),
      },
      select: {id: true, amount: true, date: true, categoryId: true},
    });

    const excludedIds = new Set<string>();
    for(const t of transactions){
      const tDate = new Date(t.date);
      for(const sb of shorterOverlaps){
        if(tDate >= sb.startDate && tDate <= sb.endDate){
          const matchesShorter = !sb.categoryId || sb.categoryId === t.categoryId;
          if(matchesShorter){
            excludedIds.add(t.id);
            break;
          }
        }
      }
    }

    return transactions.reduce((sum, t) => {
      if(excludedIds.has(t.id)) return sum;
      return sum + Number(t.amount);
    }, 0);
  }

  async getStatus(userId: string, id: string){
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId},
      include: {category: true},
    });

    if(!budget) return null;

    const allBudgets = await this.prisma.budget.findMany({
      where: {userId},
      include: {category: true},
    });

    const spent = await this.calculateSpentForBudget(userId, budget, allBudgets);
    const budgetAmount = Number(budget.amount);
    const remaining = budgetAmount - spent;
    const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

    return {
      budget: {
        id: budget.id,
        amount: budgetAmount,
        startDate: budget.startDate,
        endDate: budget.endDate,
        category: budget.category,
      },
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budgetAmount,
      status: spent > budgetAmount ? "OVER_BUDGET" : "WITHIN_BUDGET",
    };
  }

  async getAggregatedByCategory(userId: string){
    const budgets = await this.prisma.budget.findMany({
      where: {userId},
      include: {category: true},
      orderBy: {startDate: 'asc'},
    });

    const grouped = new Map<string, {budgets: typeof budgets; category: typeof budgets[0]['category']}>();
    for(const budget of budgets){
      const key = budget.categoryId ?? 'uncategorized';
      if(!grouped.has(key)){
        grouped.set(key, {budgets: [], category: budget.category});
      }
      grouped.get(key)!.budgets.push(budget);
    }

    const allBudgets = budgets;

    const results: Array<{
      category: typeof budgets[0]['category'];
      totalAmount: number;
      startDate: Date;
      endDate: Date;
      spent: number;
      remaining: number;
      percentage: number;
      isOverBudget: boolean;
      status: string;
      budgets: Array<{
        id: string;
        amount: number;
        startDate: Date;
        endDate: Date;
        spent: number;
        remaining: number;
        percentage: number;
        status: string;
      }>;
    }> = [];
    for(const [, group] of grouped){
      const items = group.budgets;
      const totalAmount = items.reduce((sum, b) => sum + Number(b.amount), 0);
      const earliestStart = items[0].startDate;
      const latestEnd = items.reduce((max, b) => b.endDate > max ? b.endDate : max, items[0].endDate);

      const budgetDetails = await Promise.all(
        items.map(async(b) => {
          const bSpent = await this.calculateSpentForBudget(userId, b, allBudgets);
          const bAmount = Number(b.amount);
          return {
            id: b.id,
            amount: bAmount,
            startDate: b.startDate,
            endDate: b.endDate,
            spent: bSpent,
            remaining: bAmount - bSpent,
            percentage: bAmount > 0 ? Math.round((bSpent / bAmount) * 100) : 0,
            status: bSpent > bAmount ? "OVER_BUDGET" : "WITHIN_BUDGET",
          };
        })
      );

      const categorySpent = budgetDetails.reduce((sum, b) => sum + b.spent, 0);
      const remaining = totalAmount - categorySpent;
      const percentage = totalAmount > 0 ? Math.round((categorySpent / totalAmount) * 100) : 0;

      results.push({
        category: group.category,
        totalAmount,
        startDate: earliestStart,
        endDate: latestEnd,
        spent: categorySpent,
        remaining,
        percentage,
        isOverBudget: categorySpent > totalAmount,
        status: categorySpent > totalAmount ? "OVER_BUDGET" : "WITHIN_BUDGET",
        budgets: budgetDetails,
      });
    }

    return results;
  }

  public async checkBudgetOverall(userId: string, transaction: any) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: today },
        endDate: { gte: today },
        ...(transaction.categoryId ? { OR: [{ categoryId: transaction.categoryId }, { categoryId: null }] } : { categoryId: null }),
      },
      include: { category: true },
    });

    const hasNotificationToday = async (titlePrefix: string) => {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          type: 'BUDGET_ALERT',
          title: { startsWith: titlePrefix },
          createdAt: { gte: startOfToday },
        },
      });
      return !!existing;
    };

    const allBudgets = await this.prisma.budget.findMany({
      where: {userId},
      include: {category: true},
    });

    for(const budget of budgets){
      const budgetAmount = Number(budget.amount);
      const categoryName = budget.category?.name ?? 'Overall';

      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const totalDays = Math.round((budget.endDate.getTime() - budget.startDate.getTime()) / millisecondsPerDay) + 1;
      const dailyAllowance = budgetAmount / totalDays;

      const userSettings = await this.settingsService.findOneByKey(userId, 'BUDGET_TIME_PREFERENCE');
      const timePreference = userSettings?.value ?? 'DAILY';

      if(timePreference === 'DAILY'){
        const todaySpent = await this.calculateSpentForBudget(userId, {...budget, startDate: startOfToday, endDate: endOfToday}, allBudgets);

        if(todaySpent > dailyAllowance){
          const existingDebt = await this.debtService.findOneByBudgetId(budget.id);
          const existingAmount = existingDebt ? Number(existingDebt.debtAmount) : 0;
          const dailyOverspend = todaySpent - dailyAllowance;
          const totalDebt = existingAmount + dailyOverspend;
          await this.debtService.create({
            budgetId: budget.id,
            debtAmount: totalDebt,
          });

          const notified = await hasNotificationToday('Daily Budget Exceeded');
          if(!notified){
            await this.notificationService.create(
              userId,
              'BUDGET_ALERT',
              'Daily Budget Exceeded',
              `You spent Rp ${todaySpent.toLocaleString('id-ID')} today, which is over your daily ${categoryName} allowance of Rp ${Math.round(dailyAllowance).toLocaleString('id-ID')}.`,
            );
          }
        }
        continue;
      }

      const totalSpent = await this.calculateSpentForBudget(userId, budget, allBudgets);
      const percentage = budgetAmount > 0 ? Math.round((totalSpent / budgetAmount) * 100) : 0;

      if(totalSpent > budgetAmount){
        const totalDebt = totalSpent - budgetAmount;
        await this.debtService.create({
          budgetId: budget.id,
          debtAmount: totalDebt,
        });

        const notified = await hasNotificationToday('Budget Exceeded');
        if(!notified){
          await this.notificationService.create(
            userId,
            'BUDGET_ALERT',
            'Budget Exceeded',
            `You have exceeded your ${categoryName} budget. Current spending: Rp ${totalSpent.toLocaleString('id-ID')}`,
          );
        }
      } else if(percentage >= 80){
        const notified = await hasNotificationToday('Budget Warning');
        if(!notified){
          await this.notificationService.create(
            userId,
            'BUDGET_ALERT',
            'Budget Warning',
            `You have used ${percentage}% of your ${categoryName} budget.`,
          );
        }
      }
    }
  }
}
