import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSavingPointDto, UpdateSavingPointDto, AllocateToGoalDto } from '../../framework/dto/index.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { Cron } from '@nestjs/schedule';
import { Budget } from '../../../../../generated/prisma/client.js';
import { TransactionService } from 'src/modules/transaction/core/app/transaction.service.js';

@Injectable()
export class SavingPointService{
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly transactionService: TransactionService,
  ) {}

  // CRON JOB daily
  @Cron('0 0 1 * * *')   // Runs once at 1:00:00 AM every day
  async handleCron() {
    // find all budget that is stil valid till today 
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();

    // Budgets still active (endDate >= today)
    const budgets = await this.prisma.budget.findMany({
      where: { endDate: { gte: today } }, // gte not lt — active budgets
    });

    for(const budget of budgets){
      // get user preference settings
      const settings = await this.prisma.settings.findUnique({
        where: {
          userId_key: {
            userId: budget.userId,
            key: 'BUDGET_TIME_PREFERENCE',
          },
        },
      });

      // if user settings doesn't exist we skip the user 
      if(!settings) continue;

      if(settings.value === 'daily') {
        await this.savingDaily(budget.userId, budget, yesterday);
      } 
    }
  }

  async savingDaily(userId: string, budget: any, date: Date) {
    const periodDays = Math.ceil(
      (budget.endDate - budget.startDate) / (1000 * 60 * 60 * 24)
    );
    const dailyLimit = Number(budget.amount) / periodDays;

    // Fixed: correct branch logic
    const totalSpent = budget.categoryId
      ? await this.transactionService.getTotalSpentByDayByCategory(userId, budget.categoryId, date) 
      : await this.transactionService.getTotalSpentByDay(userId, date);

    // TODO: implement upsert
    if (totalSpent < dailyLimit) {
      await this.prisma.savingPoint.create({
        data: { budgetId: budget.id, savingAmount: dailyLimit - totalSpent },
      });
    }
  }

  async savingMonthly(userId: string, budgetId: string, startDate: string, endDate: string) {
    const budget = await this.prisma.budget.findUnique(
      {
        where: {
          id: budgetId,
        }
      }
    )
    if(!budget) throw new Error('Budget not found');
    const totalSpent = budget.categoryId
      ? await this.transactionService.getTotalSpentThisMonthByCategory(userId, budget.categoryId, startDate, endDate) 
      : await this.transactionService.getTotalSpentThisMonth(userId,  startDate, endDate);

    const monthLimit = Number(budget.amount)

    // TODO: implement upsert
    if(totalSpent < monthLimit) {
      await this.prisma.savingPoint.create({
        data: { budgetId: budget.id, savingAmount: monthLimit - totalSpent },
      });
    }
  }

  async create(userId: string, dto: CreateSavingPointDto){
    // Verify budget belongs to user
    const budget = await this.prisma.budget.findFirst({
      where: {id: dto.budgetId, userId},
    });
    if(!budget) throw new Error('Budget not found');

    const savingPoint = await this.prisma.savingPoint.create({
      data: {
        budgetId: dto.budgetId,
        savingAmount: dto.savingAmount,
      },
    });

    await this.activityLogService.logActivity(userId, 'CREATE', 'SavingPoint', savingPoint.id, {budgetId: dto.budgetId, savingAmount: Number(savingPoint.savingAmount)});

    return savingPoint;
  }

  async findAllByUser(userId: string){
    return this.prisma.savingPoint.findMany({
      where: {budget: {userId}},
      include: {budget: {select: {id: true, amount: true}}},
      orderBy: {createdAt: 'desc'},
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.savingPoint.findFirst({
      where: {id, budget: {userId}},
      include: {
        budget: {select: {id: true, amount: true}},
        contributions: {
          orderBy: {contributionDate: 'desc'},
          include: {goal: {select: {id: true, name: true}}},
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateSavingPointDto){
    const savingPoint = await this.prisma.savingPoint.findFirst({
      where: {id, budget: {userId}},
    });
    if(!savingPoint) return null;

    const updated = await this.prisma.savingPoint.update({
      where: {id},
      data: {savingAmount: dto.savingAmount},
    });

    await this.activityLogService.logActivity(userId, 'UPDATE', 'SavingPoint', id, {savingAmount: Number(updated.savingAmount)});

    return updated;
  }

  async delete(userId: string, id: string){
    const savingPoint = await this.prisma.savingPoint.findFirst({
      where: {id, budget: {userId}},
    });
    if(!savingPoint) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'SavingPoint', id);

    return this.prisma.savingPoint.delete({
      where: {id},
    });
  }

  // Allocate saving to a goal (wrapper around goal contribute)
  async allocateToGoal(userId: string, savingPointId: string, dto: AllocateToGoalDto){
    const savingPoint = await this.prisma.savingPoint.findFirst({
      where: {id: savingPointId, budget: {userId}},
    });
    if(!savingPoint) throw new Error('SavingPoint not found');

    if(Number(savingPoint.savingAmount) < dto.amount){
      throw new Error('Insufficient balance');
    }

    // Get the goal to verify ownership
    const goal = await this.prisma.goal.findFirst({
      where: {id: dto.goalId, userId},
    });
    if(!goal) throw new Error('Goal not found');

    // Deduct from saving point
    await this.prisma.savingPoint.update({
      where: {id: savingPointId},
      data: {savingAmount: {decrement: dto.amount}},
    });

    // Update goal current amount
    const newAmount = Number(goal.currentAmount) + dto.amount;
    const targetAmount = Number(goal.targetAmount);
    const isAchieved = newAmount >= targetAmount;

    await this.prisma.goal.update({
      where: {id: dto.goalId},
      data: {
        currentAmount: newAmount,
        status: isAchieved ? 'ACHIEVED' : goal.status,
      },
    });

    // Create contribution record
    await this.prisma.goalContribution.create({
      data: {
        goalId: dto.goalId,
        savingPointId: savingPointId,
        amount: dto.amount,
        contributionDate: new Date(),
        note: dto.note ?? null,
      },
    });

    await this.activityLogService.logActivity(userId, 'ALLOCATE', 'SavingPoint', savingPointId, {goalId: dto.goalId, amount: dto.amount});

    return this.prisma.savingPoint.findUnique({
      where: {id: savingPointId},
    });
  }
}
