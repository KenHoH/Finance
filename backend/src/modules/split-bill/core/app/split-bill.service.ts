import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSplitBillDto } from './create-split-bill.dto.js';
import {
  UpdateSplitBillDto,
  UpdateParticipantDto,
} from './update-split-bill.dto.js';
import { SupabaseStorageService } from './supabase-storage.service.js';
import { FriendService } from '../../../friend/core/app/friend.service.js';
import { NotificationService } from '../../../notification/core/app/notification.service.js';
import { NotificationType } from '../../../notification/framework/dtos/create-notification.js';
import type { Express } from 'express';

const splitBillInclude = {
  items: true,
  participants: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      },
    },
  },
  creator: {
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
    },
  },
};

@Injectable()
export class SplitBillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: SupabaseStorageService,
    private readonly friendService: FriendService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(creatorId: string, dto: CreateSplitBillDto) {
    for (const participant of dto.participants) {
      if (participant.userId && participant.userId !== creatorId) {
        const areFriends = await this.friendService.checkAreFriends(
          creatorId,
          participant.userId,
        );
        if (!areFriends) {
          throw new ForbiddenException(
            'User is not your friend. Add them as a friend first.',
          );
        }
      }
    }

    // Calculate participant amounts from items if provided
    let participantData: {
      userId?: string;
      name?: string;
      amountOwed: number;
    }[];
    if (dto.items && dto.items.length > 0) {
      const owedMap = new Map<string, number>();
      // Pre-populate all participants with 0
      for (const p of dto.participants) {
        const key = p.userId || p.name || '';
        owedMap.set(key, 0);
      }
      for (const item of dto.items) {
        const itemTotal = Number(item.price) * item.quantity;
        if (item.assignedTo.length > 0) {
          const share = itemTotal / item.assignedTo.length;
          for (const userId of item.assignedTo) {
            owedMap.set(userId, (owedMap.get(userId) || 0) + share);
          }
        } else {
          // Split equally among all participants if unassigned
          const share = itemTotal / dto.participants.length;
          for (const p of dto.participants) {
            const key = p.userId || p.name || '';
            owedMap.set(key, (owedMap.get(key) || 0) + share);
          }
        }
      }
      // Calculate total subtotal from items
      const totalSubtotal = Array.from(owedMap.values()).reduce(
        (sum, v) => sum + v,
        0,
      );
      const taxRate = dto.taxRate || 0;
      const serviceChargeRate = dto.serviceChargeRate || 0;
      const discountAmount = dto.discountAmount || 0;
      const totalTax = Math.round(totalSubtotal * (taxRate / 100));
      const totalService = Math.round(
        totalSubtotal * (serviceChargeRate / 100),
      );
      const grandTotal =
        totalSubtotal + totalTax + totalService - discountAmount;

      // Apply modifiers proportionally per participant
      const rawShares = dto.participants.map((p) => {
        const key = p.userId || p.name || '';
        const subtotal = owedMap.get(key) || 0;
        const taxShare = subtotal * (taxRate / 100);
        const serviceShare = subtotal * (serviceChargeRate / 100);
        const discountShare =
          totalSubtotal > 0 ? (subtotal / totalSubtotal) * discountAmount : 0;
        return {
          userId: p.userId,
          name: p.name,
          subtotal,
          taxShare,
          serviceShare,
          discountShare,
        };
      });

      const roundedTax = rawShares.map((s) => Math.round(s.taxShare));
      const roundedService = rawShares.map((s) => Math.round(s.serviceShare));
      const roundedDiscount = rawShares.map((s) => Math.round(s.discountShare));
      const taxDiff = totalTax - roundedTax.reduce((a, b) => a + b, 0);
      const serviceDiff =
        totalService - roundedService.reduce((a, b) => a + b, 0);
      const discountDiff =
        discountAmount - roundedDiscount.reduce((a, b) => a + b, 0);
      if (rawShares.length > 0) {
        const lastIdx = rawShares.length - 1;
        roundedTax[lastIdx] += taxDiff;
        roundedService[lastIdx] += serviceDiff;
        roundedDiscount[lastIdx] += discountDiff;
      }

      const rawAmounts = rawShares.map(
        (s, i) =>
          s.subtotal + roundedTax[i] + roundedService[i] - roundedDiscount[i],
      );
      const roundedAmounts = rawAmounts.map((a) => Math.round(a));
      const amountDiff = grandTotal - roundedAmounts.reduce((a, b) => a + b, 0);
      if (roundedAmounts.length > 0) {
        roundedAmounts[roundedAmounts.length - 1] += amountDiff;
      }

      participantData = rawShares.map((s, i) => ({
        userId: s.userId,
        name: s.name,
        amountOwed: roundedAmounts[i],
      }));

      const totalOwed = participantData.reduce(
        (sum, p) => sum + p.amountOwed,
        0,
      );
      if (Math.abs(totalOwed - grandTotal) > 2) {
        throw new BadRequestException(
          'Item assignments do not match total amount with modifiers.',
        );
      }
      if (Math.abs(grandTotal - Number(dto.totalAmount)) > 2) {
        throw new BadRequestException(
          'Total amount does not match subtotal + tax + service - discount.',
        );
      }
    } else {
      const totalOwed = dto.participants.reduce(
        (sum, p) => sum + Number(p.amountOwed || 0),
        0,
      );
      if (Math.abs(totalOwed - Number(dto.totalAmount)) > 0.01) {
        throw new BadRequestException(
          'Sum of participant amounts must equal total amount.',
        );
      }
      participantData = dto.participants.map((p) => ({
        userId: p.userId,
        name: p.name,
        amountOwed: p.amountOwed || 0,
      }));
    }

    const bill = await this.prisma.splitBill.create({
      data: {
        creatorId,
        totalAmount: dto.totalAmount,
        description: dto.description,
        date: new Date(dto.date),
        receiptImageUrl: dto.receiptImageUrl || null,
        items: dto.items
          ? {
              create: dto.items.map((it) => ({
                item: it.item,
                quantity: it.quantity,
                price: it.price,
                assignedTo: it.assignedTo,
              })),
            }
          : undefined,
        participants: {
          create: participantData,
        },
      },
      include: splitBillInclude,
    });

    for (const p of bill.participants) {
      if (p.userId && p.userId !== creatorId) {
        await this.notificationService.create(
          p.userId,
          NotificationType.SPLIT_BILL_INVITE,
          'New Split Bill',
          'You were added to "' +
            bill.description +
            '" for Rp ' +
            Number(p.amountOwed).toLocaleString('id-ID') +
            '.',
        );
      }
    }

    return bill;
  }

  async findAll(userId: string) {
    const bills = await this.prisma.splitBill.findMany({
      where: {
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      },
      orderBy: { date: 'desc' },
      include: splitBillInclude,
    });

    return bills;
  }

  async findOne(userId: string, id: string) {
    const bill = await this.prisma.splitBill.findFirst({
      where: {
        id,
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      },
      include: splitBillInclude,
    });

    if (!bill) return null;
    return bill;
  }

  async update(creatorId: string, id: string, dto: UpdateSplitBillDto) {
    const bill = await this.prisma.splitBill.findFirst({
      where: { id, creatorId },
    });

    if (!bill) return null;

    return this.prisma.splitBill.update({
      where: { id },
      data: {
        description: dto.description,
        status: dto.status,
      },
      include: splitBillInclude,
    });
  }

  async updateParticipant(
    userId: string,
    billId: string,
    participantId: string,
    dto: UpdateParticipantDto,
  ) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: { splitBill: true },
    });

    if (!participant) return null;

    const canManage = participant.splitBill.creatorId === userId;
    const isOwnParticipant = participant.userId === userId;

    if (!canManage && !isOwnParticipant) return null;

    const updated = await this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: {
        status: dto.status,
        paidAt:
          dto.status === 'PAID_PENDING_CONFIRMATION' ||
          dto.status === 'CONFIRMED'
            ? new Date()
            : null,
        rejectionReason: dto.status === 'PENDING' ? dto.rejectionReason : null,
        notes: dto.notes,
      },
    });

    if (dto.status === 'CONFIRMED') {
      await this.checkAndUpdateBillStatus(billId);
    }

    return updated;
  }

  async confirmPayment(
    creatorId: string,
    billId: string,
    participantId: string,
  ) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: { splitBill: true },
    });

    if (!participant) return null;
    if (participant.splitBill.creatorId !== creatorId) return null;

    const updated = await this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: { status: 'CONFIRMED', paidAt: new Date() },
    });

    await this.checkAndUpdateBillStatus(billId);

    if (updated.userId) {
      await this.notificationService.create(
        updated.userId,
        NotificationType.SPLIT_BILL_CONFIRMED,
        'Payment Confirmed',
        'Your payment for "' +
          participant.splitBill.description +
          '" has been confirmed.',
      );
    }

    return updated;
  }

  async rejectPayment(
    creatorId: string,
    billId: string,
    participantId: string,
    reason?: string,
  ) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: { splitBill: true },
    });

    if (!participant) return null;
    if (participant.splitBill.creatorId !== creatorId) return null;

    const updated = await this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: {
        status: 'PENDING',
        paidAt: null,
        rejectionReason: reason || null,
      },
    });

    if (participant.userId) {
      await this.notificationService.create(
        participant.userId,
        NotificationType.SPLIT_BILL_REJECTED,
        'Payment Rejected',
        'Your payment for "' +
          participant.splitBill.description +
          '" was rejected' +
          (reason ? ': ' + reason : '.'),
      );
    }

    return updated;
  }

  private async checkAndUpdateBillStatus(billId: string) {
    const bill = await this.prisma.splitBill.findUnique({
      where: { id: billId },
      include: { participants: true },
    });

    if (!bill) return;

    const allConfirmed = bill.participants.every(
      (p) => p.status === 'CONFIRMED',
    );
    const anyPending = bill.participants.some((p) => p.status === 'PENDING');
    const anyPaidPending = bill.participants.some(
      (p) => p.status === 'PAID_PENDING_CONFIRMATION',
    );

    let newStatus: 'PENDING' | 'PARTIALLY_PAID' | 'SETTLED' = 'PENDING';
    if (allConfirmed) newStatus = 'SETTLED';
    else if (anyPaidPending || !anyPending) newStatus = 'PARTIALLY_PAID';

    await this.prisma.splitBill.update({
      where: { id: billId },
      data: { status: newStatus },
    });
  }

  async delete(creatorId: string, id: string) {
    const bill = await this.prisma.splitBill.findFirst({
      where: { id, creatorId },
    });

    if (!bill) return null;

    if (bill.receiptImageUrl) {
      await this.storageService.deleteFile(bill.receiptImageUrl);
    }

    return this.prisma.splitBill.delete({
      where: { id },
    });
  }

  async uploadProof(
    userId: string,
    billId: string,
    participantId: string,
    file: Express.Multer.File,
  ) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: { splitBill: true },
    });

    if (!participant) return null;

    const isCreator = participant.splitBill.creatorId === userId;
    const isOwnParticipant = participant.userId === userId;
    if (!isCreator && !isOwnParticipant) return null;

    const imageUrl = await this.storageService.uploadPaymentProof(
      file,
      participantId,
    );

    if (participant?.paymentProofUrl) {
      await this.storageService.deleteFile(participant.paymentProofUrl);
    }

    return this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: {
        paymentProofUrl: imageUrl,
      },
    });
  }

  async markAsPaid(userId: string, billId: string, participantId: string) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: { splitBill: true, user: { select: { username: true } } },
    });

    if (!participant) return null;

    const isCreator = participant.splitBill.creatorId === userId;
    const isOwnParticipant = participant.userId === userId;
    if (!isCreator && !isOwnParticipant) return null;

    const newStatus = isCreator ? 'CONFIRMED' : 'PAID_PENDING_CONFIRMATION';

    const updated = await this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: {
        status: newStatus,
        paidAt: new Date(),
      },
    });

    if (!isCreator && participant.splitBill.creatorId) {
      await this.notificationService.create(
        participant.splitBill.creatorId,
        NotificationType.SPLIT_BILL_PAID,
        'Payment Received',
        (participant.user?.username || 'A participant') +
          ' has marked payment as paid for "' +
          participant.splitBill.description +
          '". Please confirm.',
      );
    }

    await this.checkAndUpdateBillStatus(billId);

    return updated;
  }

  async revertMarkAsPaid(
    userId: string,
    billId: string,
    participantId: string,
  ) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: { splitBill: true },
    });

    if (!participant) return null;

    const isCreator = participant.splitBill.creatorId === userId;
    const isOwnParticipant = participant.userId === userId;
    if (!isCreator && !isOwnParticipant) return null;

    if (participant.status !== 'PAID_PENDING_CONFIRMATION') return null;

    const updated = await this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: {
        status: 'PENDING',
        paidAt: null,
        rejectionReason: null,
      },
    });

    await this.checkAndUpdateBillStatus(billId);

    return updated;
  }

  async uploadReceiptImage(
    creatorId: string,
    billId: string,
    file: Express.Multer.File,
  ) {
    const bill = await this.prisma.splitBill.findFirst({
      where: { id: billId, creatorId },
    });

    if (!bill) return null;

    const imageUrl = await this.storageService.uploadPaymentProof(
      file,
      'receipt-' + billId,
    );

    if (bill.receiptImageUrl) {
      await this.storageService.deleteFile(bill.receiptImageUrl);
    }

    return this.prisma.splitBill.update({
      where: { id: billId },
      data: { receiptImageUrl: imageUrl },
      include: splitBillInclude,
    });
  }

  async uploadGenericReceipt(file: Express.Multer.File) {
    return this.storageService.uploadPaymentProof(
      file,
      'receipt-' + Date.now(),
    );
  }
}
