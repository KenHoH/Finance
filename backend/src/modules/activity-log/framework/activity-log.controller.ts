import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { ActivityLogService } from '../core/app/activity-log.service.js';
import { CreateActivityLogDto, FilterActivityLogDto } from './dto/index.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController{
  constructor(private readonly activityLogService: ActivityLogService){}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateActivityLogDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.activityLogService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(@Req() req: Request, @Query() filters: FilterActivityLogDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.activityLogService.findAll(req.user.sub, filters);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const log = await this.activityLogService.findOne(req.user.sub, id);
    if(!log) throw new NotFoundException('Activity log not found');
    return log;
  }
}
