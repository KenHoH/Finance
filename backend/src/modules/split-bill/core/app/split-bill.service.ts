import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSplitBillDto } from './create-split-bill.dto.js';
import { UpdateSplitBillDto, UpdateParticipantDto } from './update-split-bill.dto.js';
import { SupabaseStorageService } from './supabase-storage.service.js';
import { FriendService } from '../../../friend/core/app/friend.service.js';
import type { Express } from 'express';

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
      include: { participants: true },
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
      include: { participants: true },
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
      include: { participants: true },
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
      include: {participants: true},
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
}