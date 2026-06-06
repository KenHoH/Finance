import { Controller, Post, Body, Res, Req, HttpStatus, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ChatService } from '../core/app/chat.service.js';
import { ChatContextService } from '../core/app/chat-context.service.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

type ChatMessageDto = {
  role: string;
  content: string;
};

type ChatRequestDto = {
  messages: ChatMessageDto[];
  model: string;
};

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly contextService: ChatContextService,
  ) {}

  @Post()
  async chat(@Req() req: Request, @Body() dto: ChatRequestDto, @Res() res: Response) {
    console.log(
      '[ChatController] Received request, dto:',
      typeof dto,
      dto ? Object.keys(dto) : 'null',
    );

    try {
      if (
        !dto ||
        !dto.messages ||
        !Array.isArray(dto.messages) ||
        dto.messages.length === 0
      ) {
        console.log('[ChatController] Validation failed: missing messages');
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Messages are required' });
        return;
      }
      if (!dto.model) {
        console.log('[ChatController] Validation failed: missing model');
        res.status(HttpStatus.BAD_REQUEST).json({ error: 'Model is required' });
        return;
      }

      const userId = (req as any).user?.sub;
      const lastUserMessage = [...dto.messages].reverse().find(m => m.role === 'user');
      let messages = dto.messages;

      if(userId && lastUserMessage){
        const context = await this.contextService.buildContext(userId, lastUserMessage.content);
        if(context){
          messages = [
            { role: 'system', content: `You are FinBot, a helpful financial assistant for FinPro. Detect the user's language from their message and respond in that same language (Bahasa Indonesia if they use Indonesian, English otherwise). Use the following user-specific data when relevant. Do not mention this context was injected.\n\n${context}` },
            ...dto.messages,
          ];
        }
      }

      console.log(
        '[ChatController] Calling chatService with model:',
        dto.model,
      );
      const backendRes = await this.chatService.chat(messages, dto.model);
      console.log(
        '[ChatController] OpenRouter response status:',
        backendRes.status,
        'ok:',
        backendRes.ok,
      );

      if (!backendRes.ok) {
        const errBody = await backendRes.text().catch(() => 'OpenRouter error');
        console.error(
          '[ChatController] OpenRouter error:',
          backendRes.status,
          errBody,
        );
        res.status(backendRes.status).json({ error: errBody });
        return;
      }

      if (!backendRes.body) {
        console.log('[ChatController] No response body');
        res
          .status(HttpStatus.BAD_GATEWAY)
          .json({ error: 'No response from AI provider' });
        return;
      }

      console.log('[ChatController] Starting SSE stream');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = backendRes.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }

      res.end();
      console.log('[ChatController] Stream ended');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat failed';
      console.error(
        '[ChatController] Caught error:',
        message,
        err instanceof Error ? err.stack : '',
      );
      if (!res.headersSent) {
        res.status(HttpStatus.BAD_GATEWAY).json({ error: message });
      } else {
        res.end();
      }
    }
  }
}
