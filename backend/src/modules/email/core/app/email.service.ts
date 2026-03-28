import { Injectable } from '@nestjs/common';
import { connectToImap } from '../../../../infrastructure/imap/imap.services.js';

@Injectable()
export class EmailService {

  async getMailboxs(userEmail: string, googleAccessToken: string) {
    console.log('cek email service: mulai connect imap');
    return await connectToImap(userEmail, googleAccessToken);
  }
  
}
