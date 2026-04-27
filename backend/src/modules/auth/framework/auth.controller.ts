import { Controller, Get, Post, Query, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../core/app/auth.service.js';
import { generateCsrfToken, setCsrfCookie } from '../../../infrastructure/utils/csrf-token.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/google')
  @Redirect()
  googleAuth(@Query('returnTo') returnTo?: string){
    const url = this.authService.getGoogleAuthUrl(returnTo);
    return { url };
  }

  @Get('/google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) response: Response,
    @Query('state') state?: string,
  ){
    const {jwt, redirectUrl} = await this.authService.handleGoogleLogin(code, state);

    response.cookie('token', jwt, {
      maxAge: 7*24*60*60*1000, //7hari
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const csrfToken = generateCsrfToken();
    setCsrfCookie(response, csrfToken);

    response.redirect(redirectUrl);
  }

  @Get('/me')
  async getMe(@Req() req: Request){
    const token = req.cookies?.['token'];
    if(!token){
      return {user: null};
    }

    const user = await this.authService.getMe(token);
    return {user};
  }

  @Post('/logout')
  logOut(@Req() req:Request, @Res({passthrough: true}) response: Response) {
    const token = req.cookies?.['token'];
    if(!token){
      return {message: 'no activate session bro'};
    }
    response.clearCookie('token');
    response.clearCookie('csrf-token');
    return {message: 'logout succeed'};
  }
}
