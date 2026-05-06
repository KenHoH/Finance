import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { connectToImap } from '../../../../infrastructure/imap/imap.services.js';

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getMailboxs(userId: string, userEmail: string) {
    const authIdentity = await this.prisma.authIdentities.findFirst({
      where: {userId, provider: 'google'},
    });

    if(!authIdentity || !authIdentity.accessToken){
      throw new Error('Google account not linked or access token expired');
    }

    const extracted = await connectToImap(userEmail, authIdentity.accessToken);

    // Batch deduplication: 1 query for all emailIds
    const emailIds = extracted.map(e => e.emailId).filter(Boolean) as string[];
    const existingRows = await this.prisma.transaction.findMany({
      where: {userId, source: 'EMAIL', sourceId: {in: emailIds}},
      select: {sourceId: true},
    });
    const existingSet = new Set(existingRows.map(r => r.sourceId));

    const toCreate = extracted.filter(item => !item.emailId || !existingSet.has(item.emailId));
    const skipped = extracted.length - toCreate.length;

    const created: any[] = [];
    for(const item of toCreate){
      const transaction = await this.prisma.transaction.create({
        data: {
          userId,
          amount: item.amount,
          type: 'EXPENSE',
          description: item.recipient || 'Email transaction',
          date: item.date ? new Date(item.date) : new Date(),
          source: 'EMAIL',
          sourceId: item.emailId || null,
          isAutoTracked: true,
        },
      });

      await this.activityLogService.logActivity(
        userId,
        'CREATE',
        'Transaction',
        transaction.id,
        {amount: item.amount, source: 'EMAIL', description: item.recipient}
      );

      created.push(transaction);
    }

    return {
      extracted: extracted.length,
      created: created.length,
      skipped,
      transactions: created,
    };
  }

}
