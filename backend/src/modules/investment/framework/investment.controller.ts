import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { InvestmentService } from '../core/app/investment.service.js';
import {
  CreateInvestmentDto,
  UpdateInvestmentDto,
  CreateAllocationDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateInvestmentDto) {
    if (!req.user) throw new NotFoundException('not authenticated');
    try {
      return await this.investmentService.create(req.user.sub, dto);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  @Get()
  async findAll(@Req() req: Request) {
    if (!req.user) throw new NotFoundException('not authenticated');
    return this.investmentService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    if (!req.user) throw new NotFoundException('not authenticated');
    const investment = await this.investmentService.findOne(req.user.sub, id);
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentDto,
  ) {
    if (!req.user) throw new NotFoundException('not authenticated');
    const investment = await this.investmentService.update(
      req.user.sub,
      id,
      dto,
    );
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    if (!req.user) throw new NotFoundException('not authenticated');
    const investment = await this.investmentService.delete(req.user.sub, id);
    if (!investment) throw new NotFoundException('Investment not found');
    return { message: 'Investment deleted' };
  }

  @Post('allocations')
  async createAllocation(
    @Req() req: Request,
    @Body() dto: CreateAllocationDto,
  ) {
    if (!req.user) throw new NotFoundException('not authenticated');
    try {
      return await this.investmentService.createAllocation(req.user.sub, dto);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  @Get('allocations')
  async getAllAllocations(@Req() req: Request) {
    if (!req.user) throw new NotFoundException('not authenticated');
    return this.investmentService.getAllAllocations(req.user.sub);
  }

  @Get('allocations/category/:categoryId')
  async getAllocationsByCategory(
    @Req() req: Request,
    @Param('categoryId') categoryId: string,
  ) {
    if (!req.user) throw new NotFoundException('not authenticated');
    return this.investmentService.getAllocationsByCategory(
      req.user.sub,
      categoryId,
    );
  }
}
