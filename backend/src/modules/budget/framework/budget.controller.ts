import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { BudgetService } from '../core/app/budget.service.js';
import { CreateBudgetDto } from '../core/app/create-budget.dto.js';
import { UpdateBudgetDto } from '../core/app/update-budget.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBudgetDto){
    const userId = (req as any).user.sub;
    return this.budgetService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.budgetService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const budget = await this.budgetService.findOne(userId, id);
    if(!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateBudgetDto){
    const userId = (req as any).user.sub;
    const budget = await this.budgetService.update(userId, id, dto);
    if(!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const budget = await this.budgetService.delete(userId, id);
    if(!budget) throw new NotFoundException('Budget not found');
    return {message: 'Budget deleted'};
  }
}