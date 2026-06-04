import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { SplitBillService } from '../core/app/split-bill.service.js';
import { CreateSplitBillDto } from '../core/app/create-split-bill.dto.js';
import { UpdateSplitBillDto, UpdateParticipantDto } from '../core/app/update-split-bill.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('split-bills')
@UseGuards(JwtAuthGuard)
export class SplitBillController {
  constructor(
    private readonly splitBillService: SplitBillService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateSplitBillDto){
    const userId = (req as any).user.sub;
    return this.splitBillService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.splitBillService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const bill = await this.splitBillService.findOne(userId, id);
    if (!bill) throw new NotFoundException('Split bill not found');
    return bill;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateSplitBillDto){
    const userId = (req as any).user.sub;
    const bill = await this.splitBillService.update(userId, id, dto);
    if (!bill) throw new NotFoundException('Split bill not found');
    return bill;
  }

  @Put(':id/participants/:participantId')
  async updateParticipant(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body() dto: UpdateParticipantDto,
  ) {
    const userId = (req as any).user.sub;
    const participant = await this.splitBillService.updateParticipant(userId, id, participantId, dto);
    if (!participant) throw new NotFoundException('Split bill or participant not found');
    return participant;
  }

  @Post(':id/participants/:participantId/proof')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProof(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req as any).user.sub;
    const result = await this.splitBillService.uploadProof(userId, id, participantId, file);
    if (!result) throw new NotFoundException('Split bill or participant not found');
    return result;
  }

  @Post(':id/receipt-proofs')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadReceiptProofs(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = (req as any).user.sub;
    const bill = await this.splitBillService.uploadReceiptProofs(userId, id, files || []);
    if (!bill) throw new NotFoundException('Split bill not found');
    return bill;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const bill = await this.splitBillService.delete(userId, id);
    if (!bill) throw new NotFoundException('Split bill not found');
    return { message: 'Split bill deleted' };
  }
}
