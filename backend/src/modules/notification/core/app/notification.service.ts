import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotificationType } from '../../framework/dtos/create-notification.js';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: string, title: string, message: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: type as unknown as NotificationType,
        title,
        message,
      },
    });
  }

  async notifyBillReminder(
    bill: { userId: string; dueDate: Date; title: string; amount: number },
    category?: { name: string } | null,
  ) {
    const now = new Date();
    const daysUntil = Math.ceil(
      (bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prefix =
      daysUntil < 0
        ? 'Bill Overdue'
        : daysUntil === 0
          ? 'Bill Due Today'
          : 'Bill Due Soon';

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const alreadyNotified = await this.prisma.notification.findFirst({
      where: {
        userId: bill.userId,
        type: 'BILL_REMINDER',
        title: { startsWith: prefix },
        createdAt: { gte: todayStart },
      },
    });

    if (alreadyNotified) return;

    const categoryName = category?.name ? ` (${category.name})` : '';
    const amount = Number(bill.amount).toLocaleString('id-ID');

    let title: string;
    let message: string;

    if (daysUntil < 0) {
      title = `${prefix}: ${bill.title}`;
      message = `Your bill "${bill.title}"${categoryName} for Rp ${amount} is overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}.`;
    } else if (daysUntil === 0) {
      title = `${prefix}: ${bill.title}`;
      message = `Your bill "${bill.title}"${categoryName} for Rp ${amount} is due today.`;
    } else {
      title = `${prefix}: ${bill.title}`;
      message = `Your bill "${bill.title}"${categoryName} for Rp ${amount} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`;
    }

    await this.create(bill.userId, 'BILL_REMINDER', title, message);
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return null;

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return null;

    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
