import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleOauthService {

    private oauth2Client;

    constructor() {
        const CLIENT_ID = process.env.CLIENT_ID; 
        const CLIENT_SECRET = process.env.CLIENT_SECRET; 
        const REDIRECT_URI = process.env.REDIRECT_URI;

        this.oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );
    }

    public getAuthUrl() {

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
    }

}
