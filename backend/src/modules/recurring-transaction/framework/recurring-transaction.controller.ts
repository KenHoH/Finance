import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { RecurringTransactionService } from '../core/app/recurring-transaction.service.js';
import { CreateRecurringTransactionDto } from '../core/app/create-recurring-transaction.dto.js';
import { UpdateRecurringTransactionDto } from '../core/app/update-recurring-transaction.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecurringTransactionController {
  constructor(private readonly recurringService: RecurringTransactionService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateRecurringTransactionDto){
    const userId = (req as any).user.sub;
    return this.recurringService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.recurringService.findAll(userId);
  }

  @Get('active')
  async findAllActive(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.recurringService.findAllActive(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const recurring = await this.recurringService.findOne(userId, id);
    if(!recurring) throw new NotFoundException('Recurring transaction not found');
    return recurring;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateRecurringTransactionDto){
    const userId = (req as any).user.sub;
    const recurring = await this.recurringService.update(userId, id, dto);
    if(!recurring) throw new NotFoundException('Recurring transaction not found');
    return recurring;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const recurring = await this.recurringService.delete(userId, id);
    if(!recurring) throw new NotFoundException('Recurring transaction not found');
    return {message: 'Recurring transaction deleted'};
  }

  @Post('process')
  async processDue(){
    const results = await this.recurringService.processDueRecurring();
    return {processed: results.length, results};
  }
}
