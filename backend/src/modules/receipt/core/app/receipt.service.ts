import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from '../../../transaction/core/app/transaction.service.js';
import { ConfirmReceiptDto } from './scan-receipt.dto.js';

export interface OcrItem {
  item: string;
  price: number;
  quantity?: number;
}

export interface OcrResponse {
  items: OcrItem[];
  raw_text: string;
  message: string;
}

@Injectable()
export class ReceiptService {
  private readonly ocrUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
  ) {
    this.ocrUrl = this.configService.get<string>('OCR_SERVICE_URL') || 'http://localhost:5000/scan';
  }

  async scanReceipt(file: Express.Multer.File): Promise<OcrResponse> {
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    const form = new FormData();
    form.append('image', blob, file.originalname);

    const response = await fetch(this.ocrUrl, {
      method: 'POST',
      body: form,
    });

    if(!response.ok){
      throw new Error(`OCR service error: ${response.status}`);
    }

    return response.json() as Promise<OcrResponse>;
  }

  async confirmReceipt(userId: string, dto: ConfirmReceiptDto) {
    const date = dto.date || new Date().toISOString().split('T')[0];
    const created: Awaited<ReturnType<typeof this.transactionService.create>>[] = [];

    for(const item of dto.items){
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
