import { Controller, Get, Post, Put, Delete, Param, Req, UseGuards, NotFoundException, Body } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from '../core/app/notification.service.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { CreateNotificationDto } from './dtos/create-notification.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateNotificationDto ) {
    const userId = (req as any).user.sub;
    return this.notificationService.create(
      userId,
      dto.type,
      dto.title,
      dto.message
    );
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.notificationService.findAll(userId);
  }

  @Get('unread')
  async findUnread(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.notificationService.findUnread(userId);
  }

  @Put(':id/read')
  async markAsRead(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const notification = await this.notificationService.markAsRead(userId, id);
    if(!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: Request){
    const userId = (req as any).user.sub;
    const result = await this.notificationService.markAllAsRead(userId);
    return {count: result.count};
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const notification = await this.notificationService.delete(userId, id);
    if(!notification) throw new NotFoundException('Notification not found');
    return {message: 'Notification deleted'};
  }
}
