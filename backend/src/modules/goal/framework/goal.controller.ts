import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { GoalService } from '../core/app/goal.service.js';
import { CreateGoalDto } from '../core/app/create-goal.dto.js';
import { UpdateGoalDto } from '../core/app/update-goal.dto.js';
import { ContributeGoalDto } from '../core/app/contribute-goal.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateGoalDto){
    const userId = (req as any).user.sub;
    return this.goalService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.goalService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const goal = await this.goalService.findOne(userId, id);
    if(!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateGoalDto){
    const userId = (req as any).user.sub;
    const goal = await this.goalService.update(userId, id, dto);
    if(!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const goal = await this.goalService.delete(userId, id);
    if(!goal) throw new NotFoundException('Goal not found');
    return { message: 'Goal deleted' };
  }

  @Post(':id/contribute')
  async contribute(@Req() req: Request, @Param('id') id: string, @Body() dto: ContributeGoalDto){
    const userId = (req as any).user.sub;
    const goal = await this.goalService.contribute(userId, id, dto.amount);
    if(!goal) throw new NotFoundException('Goal not found');
    return goal;
  }
}