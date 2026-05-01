import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { TransactionService } from '../core/app/transaction.service.js';
import { OcrService, OcrResponse } from '../core/app/ocr.service.js';
import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { FilterTransactionDto } from './dtos/filter-transaction.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController{
  constructor(
    private readonly transactionService: TransactionService,
    private readonly ocrService: OcrService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTransactionDto){
    const userId = (req as any).user.sub;
    return this.transactionService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request, @Query() filters: FilterTransactionDto){
    const userId = (req as any).user.sub;
    return this.transactionService.findAll(userId, filters);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.findOne(userId, id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateTransactionDto){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.update(userId, id, dto);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const transaction = await this.transactionService.delete(userId, id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return {message: 'Transaction deleted'};
  }

  @Post('scan-receipt')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Receipt image file',
    schema: {
      type: 'object',
      properties: {
        receipt: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('receipt'))
  async scanReceipt(@Req() req: Request, @UploadedFile() file: Express.Multer.File){
    if(!file){
      throw new NotFoundException('No receipt image uploaded');
    }

    const result = await this.ocrService.scanReceipt(file.buffer, file.originalname);
    return result;
  }
}