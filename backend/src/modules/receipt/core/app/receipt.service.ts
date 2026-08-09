import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from '../../../transaction/core/app/transaction.service.js';
import { ConfirmReceiptDto } from './scan-receipt.dto.js';
import sharp from 'sharp';

export interface OcrItem {
  item: string;
  price: number;
  quantity?: number;
}

export interface OcrResponse {
  items: OcrItem[];
  raw_text: string;
  total: number;
  message: string;
}

@Injectable()
export class ReceiptService {
  private readonly openrouterKey: string;
  private readonly visionModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
  ) {
    this.openrouterKey =
      this.configService.get<string>('NEXT_PUBLIC_OPENROUTER_API_KEY') ||
      this.configService.get<string>('OPENROUTER_API_KEY') ||
      '';
    this.visionModel =
      this.configService.get<string>('OPENROUTER_VISION_MODEL') ||
      'nvidia/nemotron-nano-12b-v2-vl:free';
  }

  async scanReceipt(file: Express.Multer.File): Promise<OcrResponse> {
    if (!this.openrouterKey) {
      throw new BadRequestException(
        'OpenRouter API key is not configured. Set NEXT_PUBLIC_OPENROUTER_API_KEY in your .env file.',
      );
    }

    try {
      // Resize and compress image before sending to AI to reduce payload and speed up response
      const resizedBuffer = await sharp(file.buffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      const base64Image = resizedBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://finpro.app',
            'X-Title': 'FinPro',
          },
          body: JSON.stringify({
            model: this.visionModel,
            messages: [
              {
                role: 'system',
                content: 'You are a receipt parser. You must respond with ONLY valid JSON. Do not include markdown, explanations, or any text outside the JSON object.',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: dataUrl, detail: 'low' },
                  },
                  {
                    type: 'text',
                    text: 'Extract all items from this receipt. Return ONLY valid JSON with this exact shape: { "items": [{"item":"name","price":number,"quantity":number}], "total": number, "raw_text": "summary of receipt content" }. All prices should be in numeric format without currency symbols.',
                  },
                ],
              },
            ],
            temperature: 0.2,
            max_tokens: 8192,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.error(
          '[ReceiptService] OpenRouter error:',
          response.status,
          errText,
        );
        throw new Error(`OpenRouter error ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };
      console.log(
        '[ReceiptService] OpenRouter response choices:',
        data.choices ? 'present' : 'missing',
        'model:',
        data.model,
      );
      const content = data.choices?.[0]?.message?.content || '';

      // Extract JSON from markdown code blocks or raw text
      let jsonText = '';

      // Try multiple extraction strategies
      const extractionStrategies = [
        // Standard markdown code block
        () => {
          const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          return match ? match[1].trim() : '';
        },
        // Multiple code blocks - take the one that looks most like JSON
        () => {
          const matches = content.matchAll(/```(?:json)?\s*([\s\S]*?)```/g);
          let best = '';
          for (const m of matches) {
            const block = m[1].trim();
            if (block.includes('"items"') || block.includes('"total"')) {
              best = block;
              break;
            }
            if (block.startsWith('{') && block.length > best.length) {
              best = block;
            }
          }
          return best;
        },
        // Find outermost curly braces
        () => {
          let depth = 0;
          let start = -1;
          let end = -1;
          for (let i = 0; i < content.length; i++) {
            if (content[i] === '{') {
              if (depth === 0) start = i;
              depth++;
            } else if (content[i] === '}') {
              depth--;
              if (depth === 0 && start !== -1) {
                end = i;
                break;
              }
            }
          }
          return start !== -1 && end !== -1 ? content.slice(start, end + 1) : '';
        },
        // Simple fallback
        () => {
          const start = content.indexOf('{');
          const end = content.lastIndexOf('}');
          return start !== -1 && end !== -1 && end > start ? content.slice(start, end + 1) : '';
        },
      ];

      for (const strategy of extractionStrategies) {
        jsonText = strategy();
        if (jsonText) break;
      }

      if (!jsonText) {
        console.error(
          '[ReceiptService] Raw AI content:',
          content.substring(0, 1000),
        );
        throw new Error('AI response did not contain valid JSON');
      }

      console.log('[ReceiptService] JSON text length:', jsonText.length);

      let parsed:
        | { items?: OcrItem[]; total?: number; raw_text?: string }
        | undefined;
      const attempts = [
        () => JSON.parse(jsonText),
        // Remove trailing commas
        () => JSON.parse(jsonText.replace(/,(\s*[}\]])/g, '$1')),
        // Escape newlines inside strings
        () => JSON.parse(jsonText.replace(/\n/g, '\\n').replace(/\r/g, '\\r')),
        // Combine both fixes
        () =>
          JSON.parse(
            jsonText
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r'),
          ),
        // Fix single quotes to double quotes
        () => JSON.parse(jsonText.replace(/'/g, '"')),
        // Remove comments
        () => JSON.parse(jsonText.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')),
        // Fix unquoted keys
        () => JSON.parse(jsonText.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')),
      ];
      for (let i = 0; i < attempts.length; i++) {
        try {
          parsed = attempts[i]();
          break;
        } catch (err: unknown) {
          const errMsg =
            err instanceof Error ? err.message : 'Unknown parse error';
          if (i === attempts.length - 1) {
            console.error(
              '[ReceiptService] All JSON parse attempts failed. Raw JSON text:',
              jsonText.substring(0, 1000),
            );
            console.error('[ReceiptService] Parse error:', errMsg);
            throw new Error(`JSON parse failed: ${errMsg}`);
          }
        }
      }

      if (!parsed) {
        throw new Error('Unable to parse AI response');
      }

      return {
        items: parsed.items || [],
        total: parsed.total || 0,
        raw_text: parsed.raw_text || content,
        message: 'Receipt scanned successfully via AI',
      };
    } catch (err: unknown) {
      const isTimeout =
        (err instanceof Error && err.name === 'AbortError') ||
        (typeof err === 'object' &&
          err !== null &&
          (err as Record<string, unknown>).code === 'UND_ERR_HEADERS_TIMEOUT');
      if (isTimeout) {
        throw new BadRequestException(
          'Receipt scanning timed out. The AI model may be overloaded. Please try again in a few seconds.',
        );
      }
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Receipt scanning failed: ${errMsg}`);
    }
  }

  async confirmReceipt(userId: string, dto: ConfirmReceiptDto) {
    const date = dto.date || new Date().toISOString().split('T')[0];
    const created: Awaited<
      ReturnType<typeof this.transactionService.create>
    >[] = [];

    for (const item of dto.items) {
      const total = item.price * (item.quantity || 1);
      const transaction = await this.transactionService.create(userId, {
        amount: total,
        type: 'EXPENSE',
        description: item.item,
        date,
        categoryId: dto.categoryId,
        isAutoTracked: false,
        source: 'OCR_SCAN',
      });
      created.push(transaction);
    }

    return {
      created: created.length,
      transactions: created,
    };
  }
}
