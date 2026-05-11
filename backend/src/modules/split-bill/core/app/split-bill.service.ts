import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSplitBillDto } from './create-split-bill.dto.js';
import { UpdateSplitBillDto, UpdateParticipantDto } from './update-split-bill.dto.js';
import { SupabaseStorageService } from './supabase-storage.service.js';
import { FriendService } from '../../../friend/core/app/friend.service.js';
import type { Express } from 'express';

const splitBillInclude = {
  participants: true,
  creator: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
};

@Injectable()
export class SplitBillService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly storageService: SupabaseStorageService,
    private readonly friendService: FriendService,
  ) {}

  async create(creatorId: string, dto: CreateSplitBillDto){
    // Validate that all participants with userId are friends
    for(const participant of dto.participants){
      if(participant.userId){
        const areFriends = await this.friendService.checkAreFriends(creatorId, participant.userId);
        if(!areFriends){
          throw new ForbiddenException(`User ${participant.userId} is not your friend. Add them as a friend first.`);
        }
      }
    }

    return this.prisma.splitBill.create({
      data: {
        creatorId,
        totalAmount: dto.totalAmount,
        description: dto.description,
        date: new Date(dto.date),
        participants: {
          create: dto.participants.map((p) => ({
            userId: p.userId,
            name: p.name,
            amountOwed: p.amountOwed,
          })),
        },
      },
      include: splitBillInclude,
    });
  }

  async findAll(userId: string) {
    const bills = await this.prisma.splitBill.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
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
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: splitBillInclude,
    });

    if (!bill) return null;
    return bill;
  }

  async update(creatorId: string, id: string, dto: UpdateSplitBillDto){
    const bill = await this.prisma.splitBill.findFirst({
      where: {id, creatorId},
    });

    if(!bill) return null;

    return this.prisma.splitBill.update({
      where: {id},
      data: {
        description: dto.description,
        status: dto.status,
      },
      include: splitBillInclude,
    });
  }

  async updateParticipant(userId: string, billId: string, participantId: string, dto: UpdateParticipantDto){
    const participant = await this.prisma.splitParticipant.findFirst({
      where: {id: participantId, splitBillId: billId},
      include: {
        splitBill: true,
      },
    });

    if(!participant) return null;

    const canManage = participant.splitBill.creatorId === userId;
    const isOwnParticipant = participant.userId === userId;

    if(!canManage && !isOwnParticipant) return null;

    return this.prisma.splitParticipant.update({
      where: {id: participantId},
      data: {
        isPaid: dto.isPaid,
        paidAt: dto.isPaid ? new Date() : null,
      },
    });
  }

  async delete(creatorId: string, id: string){
    const bill = await this.prisma.splitBill.findFirst({
      where: {id, creatorId},
    });

    if(!bill) return null;

    return this.prisma.splitBill.delete({
      where: {id},
    });
  }

  async uploadProof(userId: string, billId: string, participantId: string, file: Express.Multer.File) {
    const participant = await this.prisma.splitParticipant.findFirst({
      where: { id: participantId, splitBillId: billId },
      include: {
        splitBill: true,
      },
    });

    if (!participant) return null;

    const canManage = participant.splitBill.creatorId === userId;
    const isOwnParticipant = participant.userId === userId;

    if(!canManage && !isOwnParticipant) return null;

    const imageUrl = await this.storageService.uploadPaymentProof(file, participantId);

    // Delete old proof if exists
    if (participant?.paymentProof) {
      await this.storageService.deleteFile(participant.paymentProof);
    }

    return this.prisma.splitParticipant.update({
      where: { id: participantId },
      data: {
        paymentProof: imageUrl,
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }

  async uploadReceiptProofs(creatorId: string, billId: string, files: Express.Multer.File[]) {
    if(files.length === 0){
      throw new BadRequestException('At least one receipt image is required');
    }

    if(files.length > 3){
      throw new BadRequestException('Maximum 3 receipt images are allowed');
    }

    const bill = await this.prisma.splitBill.findFirst({
      where: { id: billId, creatorId },
    });

    if(!bill) return null;

    const uploadedUrls = await this.storageService.uploadSplitBillReceiptProofs(files, billId);

    if(bill.receiptProofs.length > 0){
      await this.storageService.deleteFiles(bill.receiptProofs);
    }

    return this.prisma.splitBill.update({
      where: { id: billId },
      data: {
        receiptProofs: uploadedUrls,
      },
      include: splitBillInclude,
    });
  }
}