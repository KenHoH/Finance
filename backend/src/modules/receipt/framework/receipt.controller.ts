import { Controller, Post, Req, UseGuards, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
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
  @UseInterceptors(FileInterceptor('image'))
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
