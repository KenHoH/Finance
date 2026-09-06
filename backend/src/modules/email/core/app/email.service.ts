import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { GoogleOauthService } from '../../../auth/core/app/google-oauth.service.js';
import { google, type gmail_v1 } from 'googleapis';
import { Cron } from '@nestjs/schedule';
import { extractInfo } from '../../../../infrastructure/imap/helper/extractInfo.js';
import { isEmailAllowedForProcessing } from '../../../../infrastructure/imap/helper/email-validator.helper.js';
import { TransactionService } from '../../../transaction/core/app/transaction.service.js';
import { extractEmailBody, extractPart } from '../helper/email-helper.js';

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly googleOauthService: GoogleOauthService,
    private readonly transactionService: TransactionService,
  ) {}

  private readonly logger = new Logger(EmailService.name);

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
    this.logger.log(`Setting up Gmail watch for ${emailAddress}`);
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
        `Gmail watch set up for ${emailAddress}. History ID: ${historyId}, expires at: ${expiration}`,
      );

      if (!historyId) {
        this.logger.error(
          `Failed to get historyId from watch response for ${emailAddress}`,
        );
        return;
      }

      await this.catchUpHistoryGap(gmail, emailAddress, historyId);

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
      let previousHistoryId = await this.getLastHistoryId(emailAddress);

      this.logger.log(
        `Previous historyId for ${emailAddress} was ${previousHistoryId}`,
      );

      if (!previousHistoryId) {
        this.logger.error(
          `Failed to set up watch for ${emailAddress}, cannot process emails without historyId, make sure the user have initial historyId.`,
        );
        return;
      }

      const newMessages = await this.fetchGapMessageIds(
        gmail,
        previousHistoryId,
        newHistoryId,
      );

      if (newMessages.length === 0) {
        this.logger.log('No new messages found in history.');
        await this.updateEmailHistoryId(emailAddress, newHistoryId);
        return;
      }

      await this.processMessageList(gmail, userId, newMessages);
      await this.updateEmailHistoryId(emailAddress, newHistoryId);
    } catch (error) {
      this.logger.error(`Gmail API Error: ${error.message}`);
      throw error;
    }
  }

  private async catchUpHistoryGap(
    gmail: gmail_v1.Gmail,
    emailAddress: string,
    newHistoryId: string,
  ): Promise<void> {
    const previousHistoryId = await this.getLastHistoryId(emailAddress);

    if (!previousHistoryId) {
      this.logger.log('New user no history ID');
      return;
    }

    try {
      if (BigInt(previousHistoryId) >= BigInt(newHistoryId)) {
        this.logger.log('Previous historyId > newHistoryId');
        return;
      }
    } catch {
      this.logger.log('Something went wrong parsing BigInt');
      return;
    }

    this.logger.log(
      `Catching up emails for ${emailAddress} from historyId ${previousHistoryId} to ${newHistoryId}`,
    );

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: emailAddress },
        select: { id: true },
      });

      if (!user) {
        this.logger.error(
          `User with email ${emailAddress} not found in database during catch-up.`,
        );
        return;
      }

      const gapMessageIds = await this.fetchGapMessageIds(
        gmail,
        previousHistoryId,
        newHistoryId,
      );

      if (gapMessageIds.length === 0) {
        this.logger.log(`No messages to catch up for ${emailAddress}.`);
        return;
      }

      this.logger.log(
        `Found ${gapMessageIds.length} message(s) to catch up for ${emailAddress}.`,
      );

      await this.processMessageList(gmail, user.id, gapMessageIds);
    } catch (error) {
      this.logger.error(
        `Failed to catch up emails for ${emailAddress}: ${error.message}. Continuing with new historyId.`,
      );
    }
  }

  private async fetchGapMessageIds(
    gmail: gmail_v1.Gmail,
    startHistoryId: string,
    endHistoryId: string,
  ): Promise<string[]> {
    const messageIds: string[] = [];
    let pageToken: string | undefined;

    do {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        endHistoryId,
        historyTypes: ['messageAdded'],
        pageToken,
      } as gmail_v1.Params$Resource$Users$History$List);

      const history = historyResponse.data.history;
      if (history && history.length > 0) {
        history.forEach((record) => {
          if (record.messagesAdded) {
            record.messagesAdded.forEach((msgAdded) => {
              if (msgAdded.message && msgAdded.message.id) {
                messageIds.push(msgAdded.message.id);
              }
            });
          }
        });
      }

      pageToken = historyResponse.data.nextPageToken || undefined;
    } while (pageToken);

    return messageIds;
  }

  private async processMessageList(
    gmail: gmail_v1.Gmail,
    userId: string,
    messageIds: string[],
  ): Promise<void> {
    for (const messageId of messageIds) {
      try {
        const metadataResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject'],
        });

        const metaHeaders = metadataResponse.data.payload?.headers || [];
        const getMetaHeader = (name: string) =>
          metaHeaders.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || '';

        const metaFrom = getMetaHeader('from');
        const metaSubject = getMetaHeader('subject');

        if (!isEmailAllowedForProcessing(metaFrom, metaSubject)) {
          this.logger.log(
            `Skipping unrelated email. From: ${metaFrom} | Subject: ${metaSubject}`,
          );
          continue;
        }

        const emailResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        const payload = emailResponse.data.payload;
        if (!payload) continue;
        const emailBody = extractEmailBody(payload);

        const headers = payload.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || '';

        const subject = getHeader('subject');
        const from = getHeader('from');
        const html =
          extractPart(payload, 'text/html') ||
          extractPart(payload, 'text/plain') ||
          '';

        this.logger.log(
          `Successfully fetched email (${messageId}): ${subject} from ${from}`,
        );
        this.logger.log(`Email Body: ${emailBody}`);

        const extracted = extractInfo(subject, from, html, messageId);

        if (extracted.status) {
          this.logger.log(
            `Extracted transaction info: ${JSON.stringify(extracted)}`,
          );
          const amount = Number(extracted.amount);
          const date = new Date(getHeader('date'));
          const receipient = extracted.recipient || 'Recipient not found';
          const source = extracted.source || 'UNKNOWN';
          const transactionType =
            extracted.expenses === false ? 'INCOME' : 'EXPENSE';

          this.logger.log(
            `Creating ${transactionType} transaction for user ${userId} from email ${messageId} with amount ${amount}, date ${date}, recipient ${receipient}`,
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
            type: transactionType,
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
              type: transactionType,
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
}
