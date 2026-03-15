import { Controller, Get, Query, Redirect, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../core/app/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/google')
  @Redirect()
  googleAuth() {
    const url = this.authService.getGoogleAuthUrl();
    return { url };
  }

  @Get('/google/callback')
  async googleCallback(@Query('code') code: string, @Res({ passthrough: true }) response: Response,) {
    const token: string = await this.authService.getToken(code);
    response.cookie('accessToken', token, {
      maxAge: 900000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    response.redirect('/');
  }
}
