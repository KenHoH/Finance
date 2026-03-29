import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTransactionDto } from './create-transaction.dto.js';
import { UpdateTransactionDto } from './update-transaction.dto.js';
import { FilterTransactionDto } from './filter-transaction.dto.js';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto){
    return this.prisma.transaction.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        isAutoTracked: dto.isAutoTracked ?? false,
        source: dto.source ?? 'MANUAL',
      },
    });
  }

  async findAll(userId: string, filters?: FilterTransactionDto){
    const where: any = { userId };

    if(filters?.type){
      where.type = filters.type;
    }

    if(filters?.categoryId){
      where.categoryId = filters.categoryId;
    }

    if(filters?.startDate || filters?.endDate){
      where.date = {};
      if(filters.startDate) where.date.gte = new Date(filters.startDate);
      if(filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const page = Math.max(1, parseInt(filters?.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filters?.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: {date: 'desc'},
        include: {category: true},
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string){
    return this.prisma.transaction.findFirst({
      where: {id, userId},
      include: {category: true},
    });
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto){
    const transaction = await this.prisma.transaction.findFirst({
      where: {id, userId},
    });

    if(!transaction) return null;

    return this.prisma.transaction.update({
      where: {id},
      data: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        categoryId: dto.categoryId,
      },
    });
  }

  async delete(userId: string, id: string){
    const transaction = await this.prisma.transaction.findFirst({
      where: {id, userId},
    });

    if(!transaction) return null;

    return this.prisma.transaction.delete({
      where: {id},
    });
  }
}