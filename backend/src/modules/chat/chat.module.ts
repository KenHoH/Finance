import { Module } from '@nestjs/common';
import { ChatService } from './core/app/chat.service.js';
import { ChatController } from './framework/chat.controller.js';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
