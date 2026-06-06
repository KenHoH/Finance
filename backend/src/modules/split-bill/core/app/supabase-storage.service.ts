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

  private async ensureBucket(bucket: string) {
    const { data: buckets } = await this.supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === bucket)) {
      await this.supabase.storage.createBucket(bucket, { public: true });
    }
  }

  private async uploadImage(
    file: Express.Multer.File,
    fileName: string,
    bucket: string,
  ): Promise<string> {
    await this.ensureBucket(bucket);

    const compressed = await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 60 })
      .toBuffer();

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, compressed, {
        contentType: 'image/webp',
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    return `${this.configService.get<string>('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${fileName}`;
  }

  async uploadPaymentProof(
    file: Express.Multer.File,
    participantId: string,
  ): Promise<string> {
    const fileName = `${participantId}-${Date.now()}.webp`;

    return this.uploadImage(file, fileName, 'payment-proofs');
  }

  async uploadSplitBillReceiptProofs(
    files: Express.Multer.File[],
    billId: string,
  ): Promise<string[]> {
    return Promise.all(
      files.map((file, index) => {
        const fileName = `split-bill-${billId}-${Date.now()}-${index}.webp`;
        return this.uploadImage(file, fileName, 'payment-proofs');
      }),
    );
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

  private getFileNameFromUrl(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  }

  async deleteFiles(fileUrls: string[]): Promise<void> {
    const fileNames = fileUrls
      .map((fileUrl) => this.getFileNameFromUrl(fileUrl))
      .filter((fileName): fileName is string => !!fileName);

    if (fileNames.length === 0) {
      return;
    }

    const { error } = await this.supabase.storage
      .from('payment-proofs')
      .remove(fileNames);

    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      await this.deleteFiles([fileUrl]);
    } catch {
      // Ignore errors if file doesn't exist
    }
  }
}
