import { Injectable } from '@nestjs/common';
import { connectToImap } from '../../../../../src/infrastucture/imap/imap.services.js';

@Injectable()
export class EmailService {

  getMailboxs(userEmail: string, googleAccessToken: string) {
    connectToImap(userEmail, googleAccessToken);
  }
  
}
