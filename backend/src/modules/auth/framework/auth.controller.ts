import { Body, Controller, Get, Patch, Post, Query, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../core/app/auth.service.js';
import { JwtAuthGuard } from '../core/app/jwt-auth-guard.js';
import { UpdateProfileDto } from './dto/index.js';
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
      path: '/',
    });

    const csrfToken = generateCsrfToken();
    setCsrfCookie(response, csrfToken);

    response.redirect(redirectUrl);
  }

  @Get('/csrf')
  getCsrf(@Res({passthrough: true}) response: Response){
    const csrfToken = generateCsrfToken();
    setCsrfCookie(response, csrfToken);
    return {csrfToken};
  }

  @Get('/me')
  async getMe(@Req() req: Request, @Res({passthrough: true}) response: Response){
    const token = req.cookies?.['token'];
    if(!token){
      return {user: null};
    }

    const {user, isInvalid} = await this.authService.getMe(token);
    if(isInvalid){
      response.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }
    return {user};
  }

  @Post('/logout')
  logOut(@Req() req:Request, @Res({passthrough: true}) response: Response) {
    response.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    response.clearCookie('csrf-token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return {message: 'logout succeed'};
  }

  @Patch('/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto){
    if(!req.user){
      return {error: 'not authenticated'};
    }
    const userId = req.user.sub;
    const user = await this.authService.updateProfile(userId, dto);
    return {id: user.id, email: user.email, username: user.username};
  }
}
