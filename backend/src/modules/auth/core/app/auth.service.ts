import { Injectable } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service.js';


@Injectable()
export class AuthService {
 
  constructor(private readonly googleOauthService: GoogleOauthService) {
    
  }

  getGoogleAuthUrl() {
    return this.googleOauthService.getAuthUrl();
  }

  async getToken(code: string) {
    const accessToken = await this.googleOauthService.getToken(code);
    return accessToken;
  }
}