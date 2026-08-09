import { Injectable, Logger } from '@nestjs/common';
import { GoogleOauthService } from '../auth/core/app/google-oauth.service.js';
import { google } from 'googleapis';
import { AuthService } from '../auth/core/app/auth.service.js';

interface GmailPart {
  mimeType?: string | null;
  body?: { data?: string | null };
  parts?: GmailPart[];
}

@Injectable()
export class PubsubService {
  private readonly logger = new Logger(PubsubService.name);

  constructor(
    private readonly googleOauthService: GoogleOauthService,
    private readonly authService: AuthService,
  ) {}

  async processEmails(message: { data?: string }) {
    if (!message.data) {
      throw new Error('Invalid Pub/Sub message: missing data');
    }
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const { emailAddress, historyId } = JSON.parse(decodedData);

    const oauthClient = this.googleOauthService.getOauthClient();

    let refreshToken;

    try {
      refreshToken =
        await this.authService.getRefreshTokenByEmail(emailAddress);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get refresh token for ${emailAddress}: ${errMsg}`,
      );
      return;
    }

    oauthClient.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauthClient });

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId.toString(),
      });

      const history = historyResponse.data.history;
      if (!history || history.length === 0) {
        this.logger.log('No new messages found in history.');
        return;
      }

      const lastHistoryRecord = history[history.length - 1];
      const messageId = lastHistoryRecord.messagesAdded?.[0]?.message?.id;

      if (!messageId) {
        this.logger.warn(
          'Could not find a specific message ID in the history.',
        );
        return;
      }

      const emailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: messageId, // Use the real messageId, NOT the historyId
        format: 'full',
      });

      const payload = emailResponse.data.payload;
      if (!payload) {
        this.logger.warn('Email payload is empty');
        return;
      }
      const emailBody = this.extractEmailBody(payload as GmailPart);
      this.logger.log(
        `Successfully fetched email: ${emailResponse.data.snippet}`,
      );
      this.logger.log(`Email Body: ${emailBody}`);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Gmail API Error: ${errMsg}`);
      throw error;
    }
  }

  private extractEmailBody(payload: GmailPart): string {
    let encodedBody = '';

    // If it's a simple text email
    if (payload.body && payload.body.data) {
      encodedBody = payload.body.data;
    }
    // If it's a multipart email (HTML + Plain Text)
    else if (payload.parts) {
      // Try to find the plain text part first
      const textPart = payload.parts.find(
        (part) => part.mimeType === 'text/plain',
      );
      if (textPart && textPart.body && textPart.body.data) {
        encodedBody = textPart.body.data;
      } else {
        // Fallback to HTML if no plain text exists
        const htmlPart = payload.parts.find(
          (part) => part.mimeType === 'text/html',
        );
        if (htmlPart && htmlPart.body && htmlPart.body.data) {
          encodedBody = htmlPart.body.data;
        }
      }
    }

    // Gmail encodes bodies in base64url, which is slightly different than standard base64
    if (encodedBody) {
      const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf-8');
    }

    return 'No readable text found';
  }
}
