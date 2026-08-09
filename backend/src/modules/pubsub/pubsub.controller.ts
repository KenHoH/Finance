import { Controller, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PubsubService } from './pubsub.service.js';

interface PubSubBody {
  message?: {
    data?: string;
  };
}

@Controller('pubsub')
export class PubsubController {
  private readonly logger = new Logger(PubsubController.name);

  constructor(private readonly pubsubService: PubsubService) {}

  @Post()
  async handlePubSubMessage(@Req() request: Request) {
    try {
      const body = request.body as PubSubBody;
      const message = body.message;

      if (!message || !message.data) {
        return { status: 'error', message: 'Invalid Pub/Sub message format' };
      }

      await this.pubsubService.processEmails(message);

      return { status: 'success', message: 'Email Processed' };
    } catch (error) {
      this.logger.error('Error processing Pub/Sub message:', error);
      return { status: 'error', message: 'Failed to process Pub/Sub message' };
    }
  }
}
