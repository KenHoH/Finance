import { Injectable, Logger } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly googleOauthService: GoogleOauthService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  getGoogleAuthUrl() {
    return this.googleOauthService.getAuthUrl();
  }

  async handleGoogleLogin(code: string){
    const tokens = await this.googleOauthService.getToken(code);
    const profile = await this.googleOauthService.getUserProfile(tokens.access_token!);

    if(!profile.email){
      throw new Error('ga dpt email dari google');
    }

    //find or create user
    let user = await this.prisma.user.findUnique({
      where: {email: profile.email},
    });

    if(!user){
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username: profile.name || profile.email.split('@')[0],
        }
      });
      console.log('user created ok', user.id)
    }else{
      console.log('user uda ada', user.id)
    }

    await this.prisma.authIdentities.upsert({
      where:{
        userId_provider:{
          userId: user.id,
          provider: 'google',
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        providerEmail: profile.email,
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerId: profile.id || profile.email,
        providerEmail: profile.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      }
    });

    console.log('token saved to db');

    const jwt = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {jwt, user};
  }

  async getMe(token: string){
    try{
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: {id: payload.sub},
      });
      return user ? {id: user.id, email: user.email, username: user.username} : null;
    } catch{
      return null;
    }
  }
}