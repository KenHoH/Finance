import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleOauthService {

    private oauth2Client;
    private readonly logger = new Logger(GoogleOauthService.name);

    constructor(private readonly configService: ConfigService) {
        const CLIENT_ID = this.configService.get<string>('CLIENT_ID'); 
        const CLIENT_SECRET = this.configService.get<string>('CLIENT_SECRET'); 
        const REDIRECT_URI = this.configService.get<string>('REDIRECT_URI');

        if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
            this.logger.error('cek env: CLIENT_ID / CLIENT_SECRET / REDIRECT_URI kosong');
        }

        this.oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );
    }

    public getAuthUrl() {

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://mail.google.com/',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
    }
    public async getToken(code: string){
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens.access_token;
    }

}
