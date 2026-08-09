import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  constructor(private readonly configService: ConfigService) {}

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
  ) {
    const apiKey =
      this.configService.get<string>('OPENROUTER_API_KEY') ||
      this.configService.get<string>('NEXT_PUBLIC_OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OpenRouter API key is not configured');
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finpro.app',
        'X-Title': 'FinPro',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    return res;
  }
}
