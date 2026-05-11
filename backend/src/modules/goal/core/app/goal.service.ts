import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateGoalDto, UpdateGoalDto, ContributeGoalDto } from '../../framework/dto/index.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';

@Injectable()
export class GoalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(userId: string, dto: CreateGoalDto){
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });

    await this.activityLogService.logActivity(userId, 'CREATE', 'Goal', goal.id, {name: goal.name, targetAmount: Number(goal.targetAmount)});

    return goal;
  }

  async findAll(userId: string){
    return this.prisma.goal.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.goal.findFirst({
      where: {id, userId},
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto){
    const goal = await this.prisma.goal.findFirst({
      where: {id, userId},
    });

    if(!goal) return null;

    const updated = await this.prisma.goal.update({
      where: {id},
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        status: dto.status,
      },
    });

    await this.activityLogService.logActivity(userId, 'UPDATE', 'Goal', id, {name: updated.name, targetAmount: Number(updated.targetAmount)});

    return updated;
  }

  async delete(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {id, userId},
    });

    if(!goal) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'Goal', id);

    return this.prisma.goal.delete({
      where: {id},
    });
  }

  async contribute(userId: string, id: string, dto: ContributeGoalDto){
    const goal = await this.prisma.goal.findFirst({
      where: {id, userId},
    });

    if(!goal) return null;

    // Kalau pakai SavingPoint, cek balance dan kurangi
    if(dto.savingPointId){
      const savingPoint = await this.prisma.savingPoint.findFirst({
        where: {id: dto.savingPointId, budget: {userId}},
      });
      if(!savingPoint) throw new Error('SavingPoint not found');
      if(Number(savingPoint.savingAmount) < dto.amount){
        throw new Error('Insufficient saving balance');
      }

      await this.prisma.savingPoint.update({
        where: {id: dto.savingPointId},
        data: {savingAmount: {decrement: dto.amount}},
      });
    }

    const newAmount = Number(goal.currentAmount) + dto.amount;
    const targetAmount = Number(goal.targetAmount);
    const isAchieved = newAmount >= targetAmount;

    // Update goal
    await this.prisma.goal.update({
      where: {id},
      data: {
        currentAmount: newAmount,
        status: isAchieved ? 'ACHIEVED' : goal.status,
      },
    });

    // Create GoalContribution record
    await this.prisma.goalContribution.create({
      data: {
        goalId: id,
        savingPointId: dto.savingPointId ?? null,
        amount: dto.amount,
        contributionDate: new Date(),
        note: dto.note ?? null,
      },
    });

    await this.activityLogService.logActivity(userId, 'CONTRIBUTE', 'Goal', id, {amount: dto.amount, note: dto.note});

    return this.prisma.goal.findUnique({
      where: {id},
    });
  }
}