import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { connectToImap } from '../../../../infrastructure/imap/imap.services.js';
import { GoogleOauthService } from '../../../auth/core/app/google-oauth.service.js';
import { google } from 'googleapis';
import { Cron } from '@nestjs/schedule';
import { extractInfo } from '../../../../infrastructure/imap/helper/extractInfo.js';
import { TransactionService } from '../../../transaction/core/app/transaction.service.js';

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly googleOauthService: GoogleOauthService,
    private readonly transactionService: TransactionService,
  ) {}

  private readonly logger = new Logger(EmailService.name);

  async getMailboxs(userId: string, userEmail: string) {
    const result = await this.syncUserEmails(userId, userEmail, true);
    return result;
  }

  async updateEmailHistoryId(emailAddress: string, historyId: string) {
    const user = await this.prisma.user.update({
      where: {
        email: emailAddress,
      },
      data: {
        lastHistoryId: String(historyId),
      },
    });

    if (!user) {
      throw new Error(`User with email ${emailAddress} not found`);
    }
  }

  async getLastHistoryId(emailAddress: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress },
      select: { lastHistoryId: true },
    });

    if (!user?.lastHistoryId || !user) {
      this.logger.warn(
        `No previous historyId found for ${emailAddress}. Initializing watch function.`,
      );

      await this.watchGmail(emailAddress);
      return null;
    }

    return user.lastHistoryId;
  }

  async connectOauthClient(emailAddress: string) {
    const oauthClient = this.googleOauthService.getOauthClient();
    let refreshToken;

    try {
      refreshToken = await this.getRefreshTokenByEmail(emailAddress);
    } catch (error) {
      this.logger.error(
        `Failed to get refresh token for ${emailAddress}: ${error.message}`,
      );
      return null;
    }

    oauthClient.setCredentials({
      refresh_token: refreshToken,
    });

    return oauthClient;
  }

  private async getRefreshTokenByEmail(email: string) {
    const identity = await this.prisma.authIdentities.findFirst({
      where: { providerEmail: email },
    });
    if (!identity) {
      throw new Error('User not found');
    }
    return identity.refreshToken;
  }

  /**
   *
   * @param emailAddress
   * @returns nothing
   */
  async watchGmail(emailAddress: string) {
    const oauthClient = await this.connectOauthClient(emailAddress);
    if (oauthClient === null) {
      this.logger.log(
        "This email doesn't have a refresh token, skipping watch setup.",
      );
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth: oauthClient });

    const topicName = process.env.GMAIL_WATCH_TOPIC;

    if (!topicName) {
      this.logger.error(
        'GMAIL_WATCH_TOPIC is not set in environment variables.',
      );
      return;
    }

    try {
      const watchResponse = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          topicName: process.env.GMAIL_WATCH_TOPIC,
        },
      });

      const { historyId, expiration } = watchResponse.data;
      this.logger.log(
        `Gmail watch set up for ${emailAddress}. History ID: ${historyId}, expires at: ${new Date(expiration!)}`,
      );

      if (!historyId) {
        this.logger.error(
          `Failed to get historyId from watch response for ${emailAddress}`,
        );
        return;
      }

      await this.updateEmailHistoryId(emailAddress, historyId);
    } catch (error) {
      this.logger.error(
        `Failed to set up Gmail watch for ${emailAddress}: ${error.message}`,
      );
      return;
    }
  }

  async processEmails(message: any) {
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const { emailAddress, historyId: newHistoryId } = JSON.parse(decodedData);

    const oauthClient = await this.connectOauthClient(emailAddress);
    if (oauthClient === null) {
      this.logger.log(
        "This email doesn't have a refresh token, skipping watch setup.",
      );
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth: oauthClient });
    this.logger.log(
      `Processing email for ${emailAddress} with notification historyId ${newHistoryId}`,
    );

    // Fetch user to get userId for transaction recording
    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress },
      select: { id: true },
    });

    if (!user) {
      this.logger.error(
        `User with email ${emailAddress} not found in database.`,
      );
      return;
    }
    const userId = user.id;

    try {
      const previousHistoryId = await this.getLastHistoryId(emailAddress);

      this.logger.log(
        `Previous historyId for ${emailAddress} was ${previousHistoryId}`,
      );

      if (!previousHistoryId) {
        this.logger.error(
          `Failed to set up watch for ${emailAddress}, cannot process emails without historyId, make sure the user have initial historyId.`,
        );
        return;
      }

      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: previousHistoryId,
        historyTypes: ['messageAdded'],
      });

      const history = historyResponse.data.history;
      if (!history || history.length === 0) {
        this.logger.log('No new messages found in history.');
        await this.updateEmailHistoryId(emailAddress, newHistoryId);
        return;
      }

      const newMessages: string[] = [];
      history.forEach((record) => {
        if (record.messagesAdded) {
          record.messagesAdded.forEach((msgAdded) => {
            if (msgAdded.message && msgAdded.message.id) {
              newMessages.push(msgAdded.message.id);
            }
          });
        }
      });

      if (newMessages.length === 0) {
        this.logger.warn(
          'History was found, but no messagesAdded events were in it.',
        );
        await this.updateEmailHistoryId(emailAddress, newHistoryId);
        return;
      }

      for (const messageId of newMessages) {
        try {
          const emailResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
          });

          const payload = emailResponse.data.payload;
          const emailBody = this.extractEmailBody(payload);
          if (!payload) continue;

          const headers = payload.headers || [];
          const getHeader = (name: string) =>
            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
              ?.value || '';

          const subject = getHeader('subject');
          const from = getHeader('from');
          // Prioritize HTML for parsing, fallback to plain text if needed
          const html =
            this.extractPart(payload, 'text/html') ||
            this.extractPart(payload, 'text/plain') ||
            '';

          this.logger.log(
            `Successfully fetched email (${messageId}): ${emailResponse.data.snippet}`,
          );
          this.logger.log(`Email Body: ${emailBody}`);

          // INTEGRATION: Extract transaction info
          const extracted = extractInfo(subject, from, html, messageId);

          if (extracted.status) {
            this.logger.log(
              `Extracted transaction info: ${JSON.stringify(extracted)}`,
            );
            const amount = Number(extracted.amount);
            const date = new Date();
            const receipient = extracted.recipient || 'Recipient not found';
            const source = extracted.source || 'UNKNOWN';

            this.logger.log(
              `Creating transaction for user ${userId} from email ${messageId} with amount ${amount}, date ${date}, recipient ${receipient}`,
            );
            const description = `${extracted.date} - ${receipient} - ${subject} - ${amount}`;

            const existing = await this.prisma.transaction.findFirst({
              where: { userId, source: source, sourceId: messageId },
            });

            if (existing) {
              this.logger.log(
                `Transaction for email ${messageId} already exists. Skipping.`,
              );
              continue;
            }

            const transaction = await this.transactionService.create(userId, {
              amount,
              type: 'EXPENSE',
              description,
              date: date.toISOString(),
              source: source,
              sourceId: messageId,
              isAutoTracked: true,
            });

            await this.activityLogService.logActivity(
              userId,
              'CREATE',
              'Transaction',
              transaction.id,
              {
                amount: extracted.amount,
                source: source,
                description: extracted.recipient,
              },
            );
          } else {
            this.logger.log(
              `No transaction info matched for email (${messageId}).`,
            );
          }
        } catch (msgError) {
          this.logger.error(
            `Failed to process message ${messageId}: ${msgError.message}`,
          );
          continue;
        }
      }

      await this.updateEmailHistoryId(emailAddress, newHistoryId);
    } catch (error) {
      this.logger.error(`Gmail API Error: ${error.message}`);
      throw error;
    }
  }

  private extractEmailBody(payload: any): string {
    let encodedBody = '';

    const findBody = (part: any): string | null => {
      if (part.body && part.body.data) {
        return part.body.data;
      }

      if (part.parts) {
        const textPart = part.parts.find(
          (p: any) => p.mimeType === 'text/plain',
        );
        if (textPart) {
          const body = findBody(textPart);
          if (body) return body;
        }

        for (const subPart of part.parts) {
          const body = findBody(subPart);
          if (body) return body;
        }
      }

      return null;
    };

    encodedBody = findBody(payload) || '';

    if (encodedBody) {
      const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    }

    return 'No readable text found';
  }

  /**
   * Generic helper to extract a specific mime-type part from Gmail payload
   */
  private extractPart(part: any, mimeType: string): string | null {
    if (part.mimeType === mimeType && part.body && part.body.data) {
      return this.decodeBase64(part.body.data);
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        const body = this.extractPart(subPart, mimeType);
        if (body) return body;
      }
    }

    return null;
  }

  private decodeBase64(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  @Cron('0 0 * * *')
  async updateHistoryIdsForAllUsers() {
    this.logger.log(
      'Running daily job to update history IDs for all users with Gmail watch set up.',
    );

    const users = await this.prisma.user.findMany({
      select: {
        email: true,
      },
    });

    for (const user of users) {
      const emailAddress = user.email;
      try {
        await this.watchGmail(emailAddress);
      } catch (error) {
        this.logger.error(
          `Failed to update history ID for ${emailAddress}: ${error.message}`,
        );
      }
    }
  }

  async syncUserEmails(
    userId: string,
    userEmail: string,
    updateLastSync: boolean = false,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastEmailSync: true },
    });

    const authIdentity = await this.prisma.authIdentities.findFirst({
      where: { userId, provider: 'google' },
    });

    if (!authIdentity || !authIdentity.accessToken) {
      throw new Error('Google account not linked or access token expired');
    }

    const since = user?.lastEmailSync || undefined;
    const imapEmail = authIdentity.providerEmail || userEmail;
    const extracted = await connectToImap(
      imapEmail,
      authIdentity.accessToken,
      since,
    );

    const emailIds = extracted
      .map((e) => e.emailId)
      .filter(Boolean) as string[];
    const existingRows = await this.prisma.transaction.findMany({
      where: { userId, source: 'EMAIL', sourceId: { in: emailIds } },
      select: { sourceId: true },
    });
    const existingSet = new Set(existingRows.map((r) => r.sourceId));

    const toCreate = extracted.filter(
      (item) => item.emailId && !existingSet.has(item.emailId),
    );
    const skipped = extracted.length - toCreate.length;

    const created: any[] = [];
    for (const item of toCreate) {
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
        { amount: item.amount, source: 'EMAIL', description: item.recipient },
      );

      created.push(transaction);
    }

    if (updateLastSync) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastEmailSync: new Date() },
      });
    }

    return {
      extracted: extracted.length,
      created: created.length,
      skipped,
      transactions: created,
    };
  }
}
