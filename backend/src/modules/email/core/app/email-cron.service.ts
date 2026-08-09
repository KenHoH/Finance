import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EmailService } from './email.service.js';

@Injectable()
export class EmailCronService {
  private readonly logger = new Logger(EmailCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron('0 2,14 * * *')
  async handleEmailSync() {
    this.logger.log('Starting email auto-sync (9 AM & 9 PM WIB)');

    const users = await this.prisma.user.findMany({
      where: {
        identities: { some: { provider: 'google' } },
      },
      select: { id: true, email: true },
    });

    this.logger.log(`Found ${users.length} users with Google linked`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        const result = await this.emailService.syncUserEmails(
          user.id,
          user.email,
          true,
        );
        this.logger.log(
          `Synced user ${user.id}: ${result.created} created, ${result.skipped} skipped`,
        );
        successCount++;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        this.logger.error(`Failed to sync user ${user.id}: ${errMsg}`);
        failCount++;
      }
    }

    this.logger.log(
      `Email sync complete. Success: ${successCount}, Failed: ${failCount}`,
    );
  }
}
