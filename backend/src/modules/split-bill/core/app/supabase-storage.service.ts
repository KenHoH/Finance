import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_KEY')!,
    );
  }

  async uploadPaymentProof(file: Express.Multer.File, participantId: string): Promise<string> {
    const compressed = await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 60 })
      .toBuffer();

    const fileName = `${participantId}-${Date.now()}.webp`;

    const { error } = await this.supabase.storage
      .from('payment-proofs')
      .upload(fileName, compressed, {
        contentType: 'image/webp',
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    return fileName; // store just the filename, not the URL
  }

  async getSignedUrl(fileName: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('payment-proofs')
      .createSignedUrl(fileName, 3600); // 1 hour

    if (error || !data) throw new Error('Failed to generate signed URL');
    return data.signedUrl;
  }
}