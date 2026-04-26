import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OcrItem {
  item: string;
  price: number;
  quantity: number;
}

export interface OcrResponse {
  items: OcrItem[];
  raw_text: string;
  message: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly ocrServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.ocrServiceUrl = this.configService.get('OCR_SERVICE_URL') || 'http://localhost:5000';
  }

  async scanReceipt(imageBuffer: Buffer, filename: string): Promise<OcrResponse>{
    try{
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], {type: 'image/jpeg'});
      formData.append('image', blob, filename);

      const response = await fetch(`${this.ocrServiceUrl}/scan`, {
        method: 'POST',
        body: formData,
      });

      if(!response.ok){
        throw new Error(`OCR service returned ${response.status}`);
      }

      const result = await response.json();
      this.logger.log(`OCR extracted ${result.items?.length || 0} items`);

      return result;
    }catch(error){
      this.logger.error(`OCR scan failed: ${error.message}`);
      throw error;
    }
  }

  async checkHealth(): Promise<{status: string; service: string}>{
    try{
      const response = await fetch(`${this.ocrServiceUrl}/health`, {
        method: 'GET',
      });
      return await response.json();
    }catch(error){
      return {status: 'unhealthy', service: 'ocr-service'};
    }
  }
}
