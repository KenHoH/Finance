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

      const data = await response.json();
      console.log(
        '[ReceiptService] OpenRouter response choices:',
        data.choices ? 'present' : 'missing',
        'model:',
        data.model,
      );
      const content = data.choices?.[0]?.message?.content || '';

      // Extract JSON from markdown code blocks or raw text
      let jsonText = '';
      const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlock) {
        jsonText = codeBlock[1].trim();
      } else {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          jsonText = content.slice(start, end + 1);
        }
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
        () => JSON.parse(jsonText.replace(/,(\s*[}\]])/g, '$1')),
        () => JSON.parse(jsonText.replace(/\n/g, '\\n').replace(/\r/g, '\\r')),
        () =>
          JSON.parse(
            jsonText
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r'),
          ),
      ];
      for (let i = 0; i < attempts.length; i++) {
        try {
          parsed = attempts[i]();
          break;
        } catch (err: any) {
          if (i === attempts.length - 1) {
            console.error(
              '[ReceiptService] All JSON parse attempts failed. Raw JSON text:',
              jsonText.substring(0, 1000),
            );
            console.error('[ReceiptService] Parse error:', err.message);
            throw new Error(`JSON parse failed: ${err.message}`);
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
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'UND_ERR_HEADERS_TIMEOUT') {
        throw new BadRequestException(
          'Receipt scanning timed out. The AI model may be overloaded. Please try again in a few seconds.',
        );
      }
      throw new BadRequestException(
        `Receipt scanning failed: ${err.message || 'Unknown error'}`,
      );
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
