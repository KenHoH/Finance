import { Module } from '@nestjs/common';
import { PubsubController } from './pubsub.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PubsubService } from './pubsub.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PubsubController],
  providers: [PubsubService],
  exports: [],
})
export class PubsubModule {}
