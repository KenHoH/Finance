import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificationService } from './notification.service.js';

@Injectable()
export class NotificationCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Bootstrapping notification checks...');
    await this.handlePeriodicNotifications();
  }

  @Interval(process.env.NODE_ENV === 'production' ? 1800000 : 21600000) // 30min prod, 6h dev
  async handlePeriodicNotifications() {
    this.logger.log('Running periodic notification check...');
    await this.createBillReminders();
    await this.createBudgetAlerts();
    await this.createGoalAlerts();
    this.logger.log('Periodic notification check finished.');
  }

  private async createBillReminders() {
    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(23, 59, 59, 999);

    const bills = await this.prisma.bill.findMany({
      where: {
        status: { in: ['PENDING', 'OVERDUE'] },
        isReminderEnabled: true,
        paidAt: null,
        dueDate: { lte: in3Days },
      },
      include: { category: true },
    });

    for (const bill of bills) {
      await this.notificationService.notifyBillReminder(
        bill,
        bill.category ?? undefined,
      );
    }
  }

  private async createBudgetAlerts() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );

    const budgets = await this.prisma.budget.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { category: true },
    });

    for (const budget of budgets) {
      const userId = budget.userId;
      const budgetAmount = Number(budget.amount);
      const categoryName = budget.category?.name ?? 'Overall';

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          createdAt: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
      });

      const totalSpent = transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      );
      const percentage =
        budgetAmount > 0 ? Math.round((totalSpent / budgetAmount) * 100) : 0;

      if (totalSpent > budgetAmount) {
        const notified = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'BUDGET_ALERT',
            title: { startsWith: 'Budget Exceeded' },
            createdAt: { gte: todayStart },
          },
        });
        if (!notified) {
          await this.notificationService.create(
            userId,
            'BUDGET_ALERT',
            'Budget Exceeded',
            `You have exceeded your ${categoryName} budget. Current spending: Rp ${totalSpent.toLocaleString('id-ID')}`,
          );
        }
      } else if (percentage >= 80) {
        const notified = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'BUDGET_ALERT',
            title: { startsWith: 'Budget Warning' },
            createdAt: { gte: todayStart },
          },
        });
        if (!notified) {
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

  private async createGoalAlerts() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const goals = await this.prisma.goal.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
    });

    for (const goal of goals) {
      const userId = goal.userId;
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

      // deadline approaching
      if (goal.deadline && goal.deadline <= in7Days && goal.deadline >= now) {
        const daysLeft = Math.ceil(
          (goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const notified = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'GOAL_UPDATE',
            title: { startsWith: 'Goal Deadline' },
            createdAt: { gte: todayStart },
          },
        });
        if (!notified) {
          await this.notificationService.create(
            userId,
            'GOAL_UPDATE',
            'Goal Deadline Approaching',
            `Your goal "${goal.name}" deadline is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Current progress: ${percentage}%.`,
          );
        }
      }

      // milestone reached (50%, 100%)
      if (percentage >= 100) {
        const notified = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'GOAL_UPDATE',
            title: { startsWith: 'Goal Completed' },
            createdAt: { gte: todayStart },
          },
        });
        if (!notified) {
          await this.notificationService.create(
            userId,
            'GOAL_UPDATE',
            'Goal Completed',
            `Congratulations! You have reached your goal "${goal.name}".`,
          );
        }
      } else if (percentage >= 50) {
        const notified = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'GOAL_UPDATE',
            title: { startsWith: 'Goal Milestone' },
            createdAt: { gte: todayStart },
          },
        });
        if (!notified) {
          await this.notificationService.create(
            userId,
            'GOAL_UPDATE',
            'Goal Milestone Reached',
            `You have reached ${percentage}% of your goal "${goal.name}". Keep it up!`,
          );
        }
      }
    }
  }
}
