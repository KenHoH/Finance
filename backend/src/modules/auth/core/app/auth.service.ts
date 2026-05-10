import { Injectable, Logger } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EmailService } from '../../../email/core/app/email.service.js';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly googleOauthService: GoogleOauthService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  getGoogleAuthUrl(returnTo?: string){
    const state = this.encodeOauthState(returnTo);
    return this.googleOauthService.getAuthUrl(state);
  }

  async handleGoogleLogin(code: string, state?: string){
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
      this.logger.log(`User created: ${user.id}`)
    }else{
      this.logger.log(`User already exists: ${user.id}`)
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
        providerEmail: profile.email,
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerId: profile.id || profile.email,
        providerEmail: profile.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
      }
    });

    this.logger.log('Google tokens saved to database');

    // calling watch email after user login or register
    await this.emailService.watchGmail(user.email);

    const jwt = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const redirectUrl = this.buildFrontendRedirect(state);
    return {jwt, user, redirectUrl};
  }

  buildFrontendRedirect(state?: string){
    const fallback = process.env.FRONTEND_URL || 'http://localhost:3001';
    const returnTo = this.decodeOauthState(state);
    if(!returnTo){
      return fallback;
    }

    try{
      const fallbackUrl = new URL(fallback);
      const redirectUrl = returnTo.startsWith('/') ? new URL(returnTo, fallbackUrl) : new URL(returnTo);
      if(!this.isAllowedFrontendOrigin(redirectUrl.origin, fallbackUrl.origin)){
        return fallback;
      }
      return redirectUrl.toString();
    }catch{
      return fallback;
    }
  }

  async getMe(token: string): Promise<{user: {id: string; email: string; username: string; createdAt: Date} | null; isInvalid: boolean}>{
    try{
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: {id: payload.sub},
      });
      if(!user){
        return {user: null, isInvalid: false};
      }
      return {user: {id: user.id, email: user.email, username: user.username, createdAt: user.createdAt}, isInvalid: false};
    } catch{
      return {user: null, isInvalid: true};
    }
  }

  async updateProfile(userId: string, data: {username?: string}){
    if(!data.username || data.username.trim().length === 0){
      throw new Error('username is required');
    }

    return this.prisma.user.update({
      where: {id: userId},
      data: {username: data.username.trim()},
    });
  }

  async getRefreshTokenByEmail(email: string){
    const user = await this.prisma.authIdentities.findFirst({
      where: {
        providerEmail: email
      }
    });
    if(!user){
      throw new Error('User not found');
    }
    return user.refreshToken;
  }

  private encodeOauthState(returnTo?: string){
    if(!returnTo){
      return undefined;
    }

    if(returnTo.startsWith('/')){
      return Buffer.from(JSON.stringify({returnTo}), 'utf8').toString('base64url');
    }

    try{
      const url = new URL(returnTo);
      if(!this.isAllowedFrontendOrigin(url.origin)){
        return undefined;
      }
      return Buffer.from(JSON.stringify({returnTo: url.toString()}), 'utf8').toString('base64url');
    }catch{
      return undefined;
    }
  }

  private decodeOauthState(state?: string){
    if(!state){
      return null;
    }

    try{
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {returnTo?: string};
      if(!decoded.returnTo){
        return null;
      }

      if(decoded.returnTo.startsWith('/')){
        return decoded.returnTo;
      }

      const url = new URL(decoded.returnTo);
      if(!this.isAllowedFrontendOrigin(url.origin)){
        return null;
      }
      return url.toString();
    }catch{
      return null;
    }
  }

  private isAllowedFrontendOrigin(origin: string, fallbackOrigin?: string){
    const allowedOrigins = new Set<string>();
    if(fallbackOrigin){
      allowedOrigins.add(fallbackOrigin);
    }

    const frontendUrl = process.env.FRONTEND_URL;
    if(frontendUrl){
      try{
        allowedOrigins.add(new URL(frontendUrl).origin);
      }catch{}
    }

    if(process.env.NODE_ENV !== 'production'){
      allowedOrigins.add('http://localhost:3000');
      allowedOrigins.add('http://localhost:3001');
    }

    return allowedOrigins.has(origin);
  }
}