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

    public getAuthUrl(state?: string){

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://mail.google.com/',.
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            state,
            scope: scopes,
        });
    }
    
    public async getToken(code: string){
        const { tokens } = await this.oauth2Client.getToken(code);
        console.log('token received', {
            hasAccess: !!tokens.access_token,
            hasRefresh: !!tokens.refresh_token,
            expiry: tokens.expiry_date,
        })
        return tokens;
    }

    public async getUserProfile(accessToken: string){
        this.oauth2Client.setCredentials({access_token: accessToken});
        const oauth2 = google.oauth2({version: 'v2', auth: this.oauth2Client});
        const {data} = await oauth2.userinfo.get();
        console.log('user profile = ', {email: data.email, name: data.name})
        return data;
        return tokens.access_token;
    }

}
