import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EmailService } from '../core/app/email.service.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import type { Request } from 'express';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}
  @Get()
  async getMailBoxes(
    @Req() request: Request
  ) {
    const userId = (request as any).user.sub;
    const email = (request as any).user.email;
    return this.emailService.getMailboxs(userId, email);
  }
}
