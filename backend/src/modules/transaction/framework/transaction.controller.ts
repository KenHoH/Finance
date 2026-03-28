import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { TransactionService } from '../core/app/transaction.service.js';
import { CreateTransactionDto } from '../core/app/create-transaction.dto.js';
import { UpdateTransactionDto } from '../core/app/update-transaction.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController{
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTransactionDto){
    const userId = (req as any).user.sub;
    return this.transactionService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.transactionService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.findOne(userId, id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateTransactionDto){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.update(userId, id, dto);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.delete(userId, id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return {message: 'Transaction deleted'};
  }
}