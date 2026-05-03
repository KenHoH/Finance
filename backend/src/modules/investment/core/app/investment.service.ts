import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateInvestmentDto, UpdateInvestmentDto, CreateAllocationDto } from '../../framework/dto/index.js';

@Injectable()
export class InvestmentService{
  constructor(private readonly prisma: PrismaService){}

  async create(userId: string, dto: CreateInvestmentDto){
    // Verify category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: {id: dto.categoryId, userId, type: 'INVESTMENT'},
    });
    if(!category) throw new Error('Investment category not found');

    return this.prisma.investment.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        totalAmount: dto.totalAmount,
      },
    });
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

    return this.prisma.investment.update({
      where: {id},
      data: {totalAmount: dto.totalAmount},
    });
  }

  async delete(userId: string, id: string){
    const investment = await this.prisma.investment.findFirst({
      where: {id, userId},
    });
    if(!investment) return null;

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
