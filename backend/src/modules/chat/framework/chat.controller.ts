import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from '../core/app/chat.service.js';

type ChatMessageDto = {
  role: string;
  content: string;
};

type ChatRequestDto = {
  messages: ChatMessageDto[];
  model: string;
};

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatRequestDto, @Res() res: Response) {
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

      console.log(
        '[ChatController] Calling chatService with model:',
        dto.model,
      );
      const backendRes = await this.chatService.chat(dto.messages, dto.model);
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
