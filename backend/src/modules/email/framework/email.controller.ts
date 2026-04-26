import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from '../core/app/email.service.js';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('email')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('start-listening')
  async startListening(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.emailService.startListening(userId);
  }
}
