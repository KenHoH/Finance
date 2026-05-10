import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { connectToImap } from '../../../../infrastructure/imap/imap.services.js';
import { AuthService } from '../../../auth/core/app/auth.service.js';
import { GoogleOauthService } from '../../../auth/core/app/google-oauth.service.js';
import { google } from 'googleapis';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly authService: AuthService,
    private readonly googleOauthService: GoogleOauthService
  ) {}

  private readonly logger = new Logger(EmailService.name);

  async getMailboxs(userId: string, userEmail: string) {
    const result = await this.syncUserEmails(userId, userEmail, true);
    return result;
  }

  async updateEmailHistoryId(emailAddress: string, historyId: string){
    const user = await this.prisma.user.update({
      where: {
        email: emailAddress,
      },
      data: {
        lastHistoryId: String(historyId),
      }
    })

    if(!user){
      throw new Error(`User with email \${emailAddress} not found`);
    }
  }

  async getLastHistoryId(emailAddress: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress },
      select: { lastHistoryId: true },
    });

    if (!user?.lastHistoryId || !user) {
      this.logger.warn(`No previous historyId found for \${emailAddress}. Initializing watch function.`);
      
      await this.watchGmail(emailAddress);
      return null;
    }

    return user.lastHistoryId;
  }

  async connectOauthClient(emailAddress: string){
    const oauthClient = this.googleOauthService.getOauthClient()
    let refreshToken;
    
    try {
        refreshToken = await this.authService.getRefreshTokenByEmail(emailAddress);
    } catch(error){
        this.logger.error(`Failed to get refresh token for ${emailAddress}: ${error.message}`);
        return null;
    }

    oauthClient.setCredentials({
        refresh_token: refreshToken,
    });

    return oauthClient;
  }

  /**
   * 
   * @param emailAddress 
   * @returns nothing
   */
  async watchGmail(emailAddress: string){
    const oauthClient = await this.connectOauthClient(emailAddress);
    if(oauthClient === null){
      this.logger.log("This email doesn't have a refresh token, skipping watch setup.");
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth: oauthClient });

    const topicName = process.env.GMAIL_WATCH_TOPIC;
    
    if(!topicName){
      this.logger.error('GMAIL_WATCH_TOPIC is not set in environment variables.');
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
        this.logger.log(`Gmail watch set up for ${emailAddress}. History ID: ${historyId}, expires at: ${new Date(expiration!)}`);

        if(!historyId){
          this.logger.error(`Failed to get historyId from watch response for ${emailAddress}`);
          return;
        }

        await this.updateEmailHistoryId(emailAddress, historyId);

    } catch (error) {
        this.logger.error(`Failed to set up Gmail watch for ${emailAddress}: ${error.message}`);
        return;
    }
  }

  async processEmails(message: any) {
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const { emailAddress, historyId: newHistoryId } = JSON.parse(decodedData);

    const oauthClient = await this.connectOauthClient(emailAddress);
    if(oauthClient === null){
      this.logger.log("This email doesn't have a refresh token, skipping watch setup.");
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth: oauthClient });
    this.logger.log(`Processing email for ${emailAddress} with notification historyId ${newHistoryId}`);

    try {
        // IMPROVEMENT: Always fetch the last processed historyId to ensure we don't miss or duplicate gaps.
        let previousHistoryId = await this.getLastHistoryId(emailAddress);

        this.logger.log(`Previous historyId for ${emailAddress} was ${previousHistoryId}`);

        if(!previousHistoryId){
          this.logger.error(`Failed to set up watch for ${emailAddress}, cannot process emails without historyId, make sure the user have initial historyId.`);
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
            // to avoid stale historyId, we update it even if there are no new messages, because Gmail might not send notifications for every single email if they come in bursts, but the historyId will still advance.
            await this.updateEmailHistoryId(emailAddress, newHistoryId);
            return;
        }

        // Safely extract message IDs, no matter what order the events happened
        let newMessages: string[] = [];
        history.forEach((record) => {
            if (record.messagesAdded) {
                record.messagesAdded.forEach((msgAdded) => {
                  if(msgAdded.message && msgAdded.message.id){
                    newMessages.push(msgAdded.message.id);
                  }
                });
            }
        });

        if (newMessages.length === 0) {
            this.logger.warn('History was found, but no messagesAdded events were in it.');
            await this.updateEmailHistoryId(emailAddress, newHistoryId);
            return;
        }

        // IMPROVEMENT: Process ALL new messages instead of just the first one to avoid data loss.
        for (const messageId of newMessages) {
          try {
            const emailResponse = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full',
            });

            const payload = emailResponse.data.payload;
            const emailBody = this.extractEmailBody(payload);
            this.logger.log(`Successfully fetched email (${messageId}): ${emailResponse.data.snippet}`);
            this.logger.log(`Email Body: ${emailBody}`);
            
            // parsing part 

          } catch (msgError) {
            this.logger.error(`Failed to process message ${messageId}: ${msgError.message}`);
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
        const textPart = part.parts.find((p: any) => p.mimeType === 'text/plain');
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


  @Cron('0 0 * * *') 
  async updateHistoryIdsForAllUsers() {
    this.logger.log('Running daily job to update history IDs for all users with Gmail watch set up.');

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
        this.logger.error(`Failed to update history ID for ${emailAddress}: ${error.message}`);
      }
    }
  }

  async syncUserEmails(userId: string, userEmail: string, updateLastSync: boolean = false) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {lastEmailSync: true},
    });

    const authIdentity = await this.prisma.authIdentities.findFirst({
      where: {userId, provider: 'google'},
    });

    if(!authIdentity || !authIdentity.accessToken){
      throw new Error('Google account not linked or access token expired');
    }

    const since = user?.lastEmailSync || undefined;
    const imapEmail = authIdentity.providerEmail || userEmail;
    const extracted = await connectToImap(imapEmail, authIdentity.accessToken, since);

    const emailIds = extracted.map(e => e.emailId).filter(Boolean) as string[];
    const existingRows = await this.prisma.transaction.findMany({
      where: {userId, source: 'EMAIL', sourceId: {in: emailIds}},
      select: {sourceId: true},
    });
    const existingSet = new Set(existingRows.map(r => r.sourceId));

    const toCreate = extracted.filter(item => item.emailId && !existingSet.has(item.emailId));
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

    if(updateLastSync){
      await this.prisma.user.update({
        where: {id: userId},
        data: {lastEmailSync: new Date()},
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
