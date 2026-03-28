import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateTransactionDto } from './create-transaction.dto.js';
import { UpdateTransactionDto } from './update-transaction.dto.js';

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

  async findAll(userId: string){
    return this.prisma.transaction.findMany({
      where: {userId},
      orderBy: {date: 'desc'},
      include: {category: true},
    });
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