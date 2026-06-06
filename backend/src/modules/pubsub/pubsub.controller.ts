import { Controller, Logger, Post, Req } from '@nestjs/common';
import { PubsubService } from './pubsub.service.js';

@Controller('pubsub')
export class PubsubController {
  private readonly logger = new Logger(PubsubController.name);

  constructor(private readonly pubsubService: PubsubService) {}

  @Post()
  async handlePubSubMessage(@Req() request: any) {
    try {
      const { message } = request.body;

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
