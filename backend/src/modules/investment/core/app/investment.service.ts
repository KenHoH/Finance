import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateInvestmentDto, UpdateInvestmentDto, CreateAllocationDto } from '../../framework/dto/index.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';

@Injectable()
export class InvestmentService{
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ){}

  async create(userId: string, dto: CreateInvestmentDto){
    // Verify category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: {id: dto.categoryId, userId, type: 'INVESTMENT'},
    });
    if(!category) throw new Error('Investment category not found');

    const investment = await this.prisma.investment.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        totalAmount: dto.totalAmount,
      },
    });

    await this.activityLogService.logActivity(userId, 'CREATE', 'Investment', investment.id, {categoryId: dto.categoryId, totalAmount: Number(investment.totalAmount)});

    return investment;
  }

  async findAllByUser(userId: string){
    return this.prisma.investment.findMany({
      where: {userId},
      include: {category: {select: {id: true, name: true, icon: true}}},
      orderBy: {createdAt: 'desc'},
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.investment.findFirst({
      where: {id, userId},
      include: {
        category: {select: {id: true, name: true, icon: true}},
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto){
    const investment = await this.prisma.investment.findFirst({
      where: {id, userId},
    });
    if(!investment) return null;

    const updated = await this.prisma.investment.update({
      where: {id},
      data: {totalAmount: dto.totalAmount},
    });

    await this.activityLogService.logActivity(userId, 'UPDATE', 'Investment', id, {totalAmount: Number(updated.totalAmount)});

    return updated;
  }

  async delete(userId: string, id: string){
    const investment = await this.prisma.investment.findFirst({
      where: {id, userId},
    });
    if(!investment) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'Investment', id);

    return this.prisma.investment.delete({
      where: {id},
    });
  }

  // Investment Allocation
  async createAllocation(userId: string, dto: CreateAllocationDto){
    // Verify category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: {id: dto.categoryId, userId, type: 'INVESTMENT'},
    });
    if(!category) throw new Error('Investment category not found');

    // Create allocation record
    const allocation = await this.prisma.investmentAllocation.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        allocationDate: new Date(dto.allocationDate),
        note: dto.note ?? null,
      },
    });

    // Update or create investment total for this category
    await this.prisma.investment.upsert({
      where: {
        userId_categoryId: {
          userId,
          categoryId: dto.categoryId,
        },
      },
      update: {
        totalAmount: {increment: dto.amount},
      },
      create: {
        userId,
        categoryId: dto.categoryId,
        totalAmount: dto.amount,
      },
    });

    await this.activityLogService.logActivity(userId, 'CREATE_ALLOCATION', 'InvestmentAllocation', allocation.id, {categoryId: dto.categoryId, amount: Number(allocation.amount)});

    return allocation;
  }

  async getAllocationsByCategory(userId: string, categoryId: string){
    return this.prisma.investmentAllocation.findMany({
      where: {userId, categoryId},
      orderBy: {allocationDate: 'desc'},
    });
  }

  async getAllAllocations(userId: string){
    return this.prisma.investmentAllocation.findMany({
      where: {userId},
      include: {category: {select: {id: true, name: true, icon: true}}},
      orderBy: {allocationDate: 'desc'},
    });
  }
}
