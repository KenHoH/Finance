import { Controller, Post, Req, UseGuards, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ReceiptService } from '../core/app/receipt.service.js';
import { ConfirmReceiptDto } from '../core/app/scan-receipt.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('scan')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async scanReceipt(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if(!file){
      throw new BadRequestException('No file uploaded');
    }
    if(!allowedMimes.includes(file.mimetype)){
      throw new BadRequestException('Invalid file type. Only PNG, JPEG, and WebP images are allowed');
    }
    const result = await this.receiptService.scanReceipt(file);
    return result;
  }

  @Post('confirm')
  async confirmReceipt(
    @Req() req: Request,
    @Body() dto: ConfirmReceiptDto,
  ) {
    const userId = (req as any).user.sub;
    const result = await this.receiptService.confirmReceipt(userId, dto);
    return result;
  }
}
