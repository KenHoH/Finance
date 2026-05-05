import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateBudgetDto } from '../../framework/dtos/create-budget.dto.js';
import { UpdateBudgetDto } from '../../framework/dtos/update-budget.dto.js';
import { NotificationService } from '../../../notification/core/app/notification.service.js';
import { DebtService } from '../../../debt/core/app/debt.service.js';
import { SettingsService } from '../../../settings/core/app/settings.service.js';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly debtService: DebtService,
    private readonly settingsService: SettingsService
  ) {}

  async create(userId: string, dto: CreateBudgetDto){
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId ?? undefined,
        amount: dto.amount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: {category: true},
    });
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

    return this.prisma.budget.update({
      where: {id},
      data: {
        amount: dto.amount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {category: true},
    });
  }

  async delete(userId: string, id: string){
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId},
    });

    if(!budget) return null;

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
  async getStatus(userId: string, id: string){
    const budget = await this.prisma.budget.findFirst({
      where: {id, userId},
      include: {category: true},
    });

    if(!budget) return null;

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
    };
  }

  public async checkBudgetOverall(userId: string, transaction: any) {
    const today = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
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

    Logger.debug(`BUDGETS TO CHECK: ${JSON.stringify(budgets)}`, 'BudgetService.checkBudgetOverall');

    for (const budget of budgets) {
      const budgetAmount = Number(budget.amount);
      const categoryName = budget.category?.name ?? 'Overall';

      // total days between start and end date
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const totalDays = Math.round((budget.endDate.getTime() - budget.startDate.getTime()) / millisecondsPerDay) + 1;
      
      const dailyAllowance = budgetAmount / totalDays;

      // today's expenses for this budget
      const todaySpentAgg = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: startOfToday, lte: endOfToday },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
        _sum: { amount: true },
      });

      // FIND the user settings preference 
      let userSettings = await this.settingsService.findOneByKey(userId, 'BUDGET_TIME_PREFERENCE');

      Logger.debug(`User settings for budget time preference: ${JSON.stringify(userSettings)}`, 'BudgetService.checkBudgetOverall');
      let timePreference = userSettings?.value ?? 'daily'; // default to daily
      
      // DAILY budget system tracker if the user choose daily
      if(timePreference === 'daily'){
        const spentToday = Number(todaySpentAgg._sum.amount || 0);
        Logger.debug(`Checking DAILY budget for budget ${budget.id} with daily allowance ${dailyAllowance} and today's spending ${spentToday}`, 'BudgetService.checkBudgetOverall');

        if (spentToday > dailyAllowance) {
          const totalDebt = spentToday - dailyAllowance;
          
          // add to debt point
          await this.debtService.create({
            budgetId: budget.id,
            debtAmount: totalDebt,
          })

          // notify the user
          await this.notificationService.create(
            userId,
            'BUDGET_ALERT',
            'Daily Budget Exceeded',
            `You spent Rp ${spentToday.toLocaleString('id-ID')} today, which is over your daily ${categoryName} allowance of Rp ${Math.round(dailyAllowance).toLocaleString('id-ID')}.`,
          );
        }
        return;
      }

      const totalSpentAgg = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
        _sum: { amount: true },
      });


      const totalSpent = Number(totalSpentAgg._sum.amount || 0);
      const percentage = budgetAmount > 0 ? Math.round((totalSpent / budgetAmount) * 100) : 0;

      if(totalSpent > budgetAmount){
        const totalDebt = totalSpent - budgetAmount;
          
          // add to debt point
        Logger.debug(`Checking MONTHLY budget for budget ${budget.id} with monthly allowance ${budgetAmount} and total spending ${totalSpent}`, 'BudgetService.checkBudgetOverall');
          await this.debtService.create({
            budgetId: budget.id,
            debtAmount: totalDebt,
          })

          // notify the user
          await this.notificationService.create(
            userId,
            'BUDGET_ALERT',
            'MONTHLY Budget Exceeded',
            `You spent Rp ${totalSpent.toLocaleString('id-ID')} today, which is over your monthly ${categoryName} allowance of Rp ${Math.round(budgetAmount).toLocaleString('id-ID')}.`,
          );
      }

      // notification for the user 
      if (percentage >= 100) {
        await this.notificationService.create(
          userId,
          'BUDGET_ALERT',
          'Budget Exceeded',
          `You have exceeded your overall ${categoryName} budget. Current spending: Rp ${totalSpent.toLocaleString('id-ID')}`,
        );
      } else if (percentage >= 80) {
        await this.notificationService.create(
          userId,
          'BUDGET_ALERT',
          'Budget Warning',
          `You have used ${percentage}% of your overall ${categoryName} budget.`,
        );
      }
    }
  }
}