import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { BillService } from '../core/app/bill.service.js';
import { CreateBillDto, UpdateBillDto, PayBillDto } from './dto/index.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('bills')
@UseGuards(JwtAuthGuard)
export class BillController{
  constructor(private readonly billService: BillService){}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBillDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.billService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.billService.findAll(req.user.sub);
  }

  @Get('reminders')
  async getReminders(@Req() req: Request){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.billService.getReminders(req.user.sub);
  }

  @Get('check-overdue')
  async checkOverdue(@Req() req: Request){
    if(!req.user) throw new NotFoundException('not authenticated');
    return this.billService.checkOverdue(req.user.sub);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const bill = await this.billService.findOne(req.user.sub, id);
    if(!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateBillDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    const bill = await this.billService.update(req.user.sub, id, dto);
    if(!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    if(!req.user) throw new NotFoundException('not authenticated');
    const bill = await this.billService.delete(req.user.sub, id);
    if(!bill) throw new NotFoundException('Bill not found');
    return {message: 'Bill deleted'};
  }

  @Post(':id/pay')
  async payBill(@Req() req: Request, @Param('id') id: string, @Body() dto: PayBillDto){
    if(!req.user) throw new NotFoundException('not authenticated');
    const bill = await this.billService.payBill(req.user.sub, id, dto);
    if(!bill) throw new NotFoundException('Bill not found');
    return bill;
  }
}
