import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AuthService } from '../core/app/auth.service.js';
import { CreateAuthDto } from '../core/model/create-auth.dto.js';
import { UpdateAuthDto } from '../core/model/update-auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/google')
  googleAuth() {
    return {
      url: this.authService.getGoogleAuthUrl()
    };
  }

  @Get('/auth/google/callback')
  googleCallback(@Query('token') token: string) {
    console.log(token);
    return token;
  }
}
