import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { GoalService } from '../core/app/goal.service.js';
import { CreateGoalDto, UpdateGoalDto, ContributeGoalDto } from './dto/index.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { EventsGateway } from '../../../infrastructure/gateway/events.gateway.js';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalController {
  constructor(
    private readonly goalService: GoalService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateGoalDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.goalService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.goalService.findAll(req.user.sub);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const goal = await this.goalService.findOne(req.user.sub, id);
    if(!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateGoalDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    const goal = await this.goalService.update(req.user.sub, id, dto);
    if(!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const goal = await this.goalService.delete(req.user.sub, id);
    if(!goal) throw new NotFoundException('Goal not found');
    return { message: 'Goal deleted' };
  }

  @Post(':id/contribute')
  async contribute(@Req() req: Request, @Param('id') id: string, @Body() dto: ContributeGoalDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    const goal = await this.goalService.contribute(req.user.sub, id, dto);
    if(!goal) throw new NotFoundException('Goal not found');
    return goal;
  }
}
