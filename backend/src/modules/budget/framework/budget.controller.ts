import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { BudgetService } from '../core/app/budget.service.js';
import { CreateBudgetDto } from './dtos/create-budget.dto.js';
import { UpdateBudgetDto } from './dtos/update-budget.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,  ) {}

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

  @Get('daily/:id')
  async getDailyBudget(
    @Req() req: Request, 
    @Param('id') id: string
  ){
    const userId = (req as any).user.sub;
    const dailyBudget = await this.budgetService.getDailyBudget(userId, id);
    if(!dailyBudget) throw new NotFoundException('Daily budget not found');
    return dailyBudget;
  }

  @Get('category')
  async getBudgetPerCategory(
    @Req() req: Request, 
  ){
    const userId = (req as any).user.sub;
    const budgetPerCategory = await this.budgetService.getBudgetPerCategory(userId);
    if(!budgetPerCategory) throw new NotFoundException('Budget per category not found');
    return budgetPerCategory;
  }

  @Get('daily/category/:id')
  async getDailyBudgetPerCategory(
    @Req() req: Request, 
    @Param('id') id: string
  ){
    const userId = (req as any).user.sub;
    const dailyBudgetPerCategory = await this.budgetService.getDailyBudgetPerCategory(userId, id);
    if(!dailyBudgetPerCategory) throw new NotFoundException('Daily budget per category not found');
    return dailyBudgetPerCategory;
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

  @Get(':id/status')
  async getStatus(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const status = await this.budgetService.getStatus(userId, id);
    if(!status) throw new NotFoundException('Budget not found');
    return status;
  }
}
