import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { connectToImap } from '../../../../infrastructure/imap/imap.services.js';
import { ExtractedInfo } from '../../../../infrastructure/imap/helper/extractInfo.js';

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService) {}

  async startListening(userId: string){
    const identity = await this.prisma.authIdentities.findFirst({
      where: { userId, provider: 'google' },
    });

    if(!identity || !identity.accessToken){
      throw new Error('Google access token not found. Please re-login.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if(!user){
      throw new Error('User not found');
    }

    const onTransaction = async(info: ExtractedInfo, subject: string) => {
      const source = this.detectSource(subject);

      await this.prisma.transaction.create({
        data: {
          userId,
          amount: info.amount,
          type: 'EXPENSE',
          description: `${source} - ${info.recipient}`,
          date: this.parseDate(info.date),
          isAutoTracked: true,
          source: 'GMAIL_PARSER',
        },
      });

      console.log(`transaction saved: ${source} ${info.amount} to ${info.recipient}`);
    };

    return await connectToImap(user.email, identity.accessToken, onTransaction);
  }

  private detectSource(subject: string): string{
    if(subject.includes('blu')) return 'BLU';
    if(subject.includes('BCA') || subject.includes('Internet Transaction')) return 'BCA';
    if(subject.includes('OVO')) return 'OVO';
    return 'UNKNOWN';
  }

  private parseDate(dateStr: string): Date{
    const parsed = new Date(dateStr);
    if(!isNaN(parsed.getTime())) return parsed;
    return new Date();
  }
}
