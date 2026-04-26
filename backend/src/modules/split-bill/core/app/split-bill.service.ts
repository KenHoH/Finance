import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSplitBillDto } from './create-split-bill.dto.js';
import { UpdateSplitBillDto, UpdateParticipantDto } from './update-split-bill.dto.js';
import { SupabaseStorageService } from './supabase-storage.service.js';

@Injectable()
export class SplitBillService {
  constructor(private readonly prisma: PrismaService, private readonly storageService: SupabaseStorageService) {}

  async create(creatorId: string, dto: CreateSplitBillDto){
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

    async findAll(creatorId: string) {
    const bills = await this.prisma.splitBill.findMany({
      where: { creatorId },
      orderBy: { date: 'desc' },
      include: { participants: true },
    });

    return bills;
  }

  async findOne(creatorId: string, id: string) {
    const bill = await this.prisma.splitBill.findFirst({
      where: { id, creatorId },
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

  async updateParticipant(creatorId: string, billId: string, participantId: string, dto: UpdateParticipantDto){
    const bill = await this.prisma.splitBill.findFirst({
      where: {id: billId, creatorId},
    });

    if(!bill) return null;

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

  async uploadProof(creatorId: string, billId: string, participantId: string, imageUrl: string) {
    const bill = await this.prisma.splitBill.findFirst({
      where: { id: billId, creatorId },
      include: { participants: true },
    });

    if (!bill) return null;

    const participant = bill.participants.find(p => p.id === participantId);

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