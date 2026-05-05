import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSavingPointDto, UpdateSavingPointDto, AllocateToGoalDto } from '../../framework/dto/index.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';

@Injectable()
export class SavingPointService{
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

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
