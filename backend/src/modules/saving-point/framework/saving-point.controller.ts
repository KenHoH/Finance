import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { SavingPointService } from '../core/app/saving-point.service.js';
import { CreateSavingPointDto, UpdateSavingPointDto, AllocateToGoalDto, AllocateToInvestmentDto, PayDebtDto } from './dto/index.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('saving-points')
@UseGuards(JwtAuthGuard)
export class SavingPointController{
  constructor(private readonly savingPointService: SavingPointService){}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateSavingPointDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    try{
      return await this.savingPointService.create(req.user.sub, dto);
    } catch(e: any){
      throw new BadRequestException(e.message);
    }
  }

  @Get()
  async findAll(@Req() req: Request){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.savingPointService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const point = await this.savingPointService.findOne(req.user.sub, id);
    if(!point) throw new NotFoundException('SavingPoint not found');
    return point;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateSavingPointDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    const point = await this.savingPointService.update(req.user.sub, id, dto);
    if(!point) throw new NotFoundException('SavingPoint not found');
    return point;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const point = await this.savingPointService.delete(req.user.sub, id);
    if(!point) throw new NotFoundException('SavingPoint not found');
    return {message: 'SavingPoint deleted'};
  }

  @Post(':id/allocate-to-goal')
  async allocateToGoal(@Req() req: Request, @Param('id') id: string, @Body() dto: AllocateToGoalDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    try{
      return await this.savingPointService.allocateToGoal(req.user.sub, id, dto);
    } catch(e: any){
      throw new BadRequestException(e.message);
    }
  }

  @Post(':id/allocate-to-investment')
  async allocateToInvestment(@Req() req: Request, @Param('id') id: string, @Body() dto: AllocateToInvestmentDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    try{
      return await this.savingPointService.allocateToInvestment(req.user.sub, id, dto);
    } catch(e: any){
      throw new BadRequestException(e.message);
    }
  }

  @Post(':id/pay-debt')
  async payDebt(@Req() req: Request, @Param('id') id: string, @Body() dto: PayDebtDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    try{
      return await this.savingPointService.payDebt(req.user.sub, id, dto);
    } catch(e: any){
      throw new BadRequestException(e.message);
    }
  }
}

