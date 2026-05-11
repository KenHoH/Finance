import { Controller, Get, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { EmailService } from '../core/app/email.service.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import type { Request } from 'express';
import { Public } from '../../../infrastructure/decorators/public.decorator.js';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  private readonly logger = new Logger(EmailController.name);

  @Get()
  async getMailBoxes(
    @Req() request: Request
  ) {
    const userId = (request as any).user.sub;
    const email = (request as any).user.email;
    return this.emailService.getMailboxs(userId, email);
  }

  @Public()
  @Post()
  async processEmails(
    @Req() request: any
  ){
    try {
        const { message } = request.body;
        
        if (!message || !message.data) {
            return { status: 'error', message: 'Invalid Pub/Sub message format' };
        }
        await this.emailService.processEmails(message);
        return { status: 'success', message: "Email Processed" };
    } catch (error) {
        this.logger.error('Error processing Pub/Sub message:', error);
        return { status: 'error', message: 'Failed to process Pub/Sub message' };
    }
  }
}
