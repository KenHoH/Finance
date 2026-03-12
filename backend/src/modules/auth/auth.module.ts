import { Module } from '@nestjs/common';
import { AuthService } from './core/app/auth.service';
import { AuthController } from './framework/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
