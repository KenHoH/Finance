import { ConsoleLogger, Controller, Get, Query, Req } from '@nestjs/common';
import { EmailService } from '../core/app/email.service.js';
import type { Request } from 'express';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}
  @Get()
  getMailBoxes(
    @Query('userEmail') userEmail: string,
    @Req() request: Request
  ) {
    console.log('Received request to get mailboxes');
    console.log(request.cookies);
    console.log(userEmail);
    return this.emailService.getMailboxs(userEmail, request.cookies['accessToken']);
  }
}
