import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateGoalDto } from './create-goal.dto.js';
import { UpdateGoalDto } from './update-goal.dto.js';

@Injectable()
export class GoalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto){
    return this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });
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

    return this.prisma.goal.update({
      where: {id},
      data: {
        name: dto.name,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        status: dto.status,
      },
    });
  }

  async delete(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {id, userId},
    });

    if(!goal) return null;

    return this.prisma.goal.delete({
      where: {id},
    });
  }

  async contribute(userId: string, id: string, amount: number){
    const goal = await this.prisma.goal.findFirst({
      where: {id, userId},
    });

    if(!goal) return null;

    const newAmount = Number(goal.currentAmount) + amount;
    const targetAmount = Number(goal.targetAmount);
    const isAchieved = newAmount >= targetAmount;

    return this.prisma.goal.update({
      where: {id},
      data: {
        currentAmount: newAmount,
        status: isAchieved ? 'ACHIEVED' : goal.status,
      },
    });
  }
}