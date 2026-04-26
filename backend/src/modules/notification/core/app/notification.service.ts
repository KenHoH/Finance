import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: string, title: string, message: string){
    return this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
      },
    });
  }

  async findAll(userId: string){
    return this.prisma.notification.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
  }

  async findUnread(userId: string){
    return this.prisma.notification.findMany({
      where: {userId, isRead: false},
      orderBy: {createdAt: 'desc'},
    });
  }

  async markAsRead(userId: string, id: string){
    const notification = await this.prisma.notification.findFirst({
      where: {id, userId},
    });

    if(!notification) return null;

    return this.prisma.notification.update({
      where: {id},
      data: {isRead: true},
    });
  }

  async markAllAsRead(userId: string){
    return this.prisma.notification.updateMany({
      where: {userId, isRead: false},
      data: {isRead: true},
    });
  }

  async delete(userId: string, id: string){
    const notification = await this.prisma.notification.findFirst({
      where: {id, userId},
    });

    if(!notification) return null;

    return this.prisma.notification.delete({
      where: {id},
    });
  }
}
