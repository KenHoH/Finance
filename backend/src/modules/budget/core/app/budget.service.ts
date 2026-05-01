import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateBudgetDto } from '../../framework/dtos/create-budget.dto.js';
import { UpdateBudgetDto } from '../../framework/dtos/update-budget.dto.js';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(userId: string){
    return this.prisma.budget.findMany({
      where: {userId},
      orderBy: {startDate: 'desc'},
      include: {category: true},
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.budget.findFirst({
      where: {id, userId},
      include: {category: true},
    });
  }

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
}