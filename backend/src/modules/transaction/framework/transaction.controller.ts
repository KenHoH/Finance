import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { TransactionService } from '../core/app/transaction.service.js';
import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { FilterTransactionDto } from './dtos/filter-transaction.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { EventsGateway } from '../../../infrastructure/gateway/events.gateway.js';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController{
  constructor(
    private readonly transactionService: TransactionService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTransactionDto){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.create(userId, dto);
    this.eventsGateway.emitToUser(userId, 'transaction:created', transaction);
    return transaction;
  }

  @Get()
  async findAll(@Req() req: Request, @Query() filters: FilterTransactionDto){
    const userId = (req as any).user.sub;
    return this.transactionService.findAll(userId, filters);
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
    if(!transaction) throw new NotFoundException('Transaction not found');
    this.eventsGateway.emitToUser(userId, 'transaction:updated', transaction);
    return transaction;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.delete(userId, id);
    if(!transaction) throw new NotFoundException('Transaction not found');
    this.eventsGateway.emitToUser(userId, 'transaction:deleted', { id });
    return {message: 'Transaction deleted'};
  }
}


