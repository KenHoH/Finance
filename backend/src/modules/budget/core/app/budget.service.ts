import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateBudgetDto } from './create-budget.dto.js';
import { UpdateBudgetDto } from './update-budget.dto.js';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto){
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
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
}