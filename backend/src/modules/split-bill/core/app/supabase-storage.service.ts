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

    const publicUrl = `${this.configService.get<string>('SUPABASE_URL')}/storage/v1/object/public/payment-proofs/${fileName}`;
    return publicUrl;
  }

  async getSignedUrl(fileName: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from('payment-proofs')
        .createSignedUrl(fileName, 3600); // 1 hour

      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try{
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      await this.supabase.storage
        .from('payment-proofs')
        .remove([fileName]);
    }catch{
      // Ignore errors if file doesn't exist
    }
  }
}