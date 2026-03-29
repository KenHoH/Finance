import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { CategoryService } from '../core/app/category.service.js';
import { CreateCategoryDto } from '../core/app/create-category.dto.js';
import { UpdateCategoryDto } from '../core/app/update-category.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCategoryDto){
    const userId = (req as any).user.sub;
    return this.categoryService.create(userId, dto);
  }

  @Get()
  async findAll(@Req() req: Request){
    const userId = (req as any).user.sub;
    return this.categoryService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const category = await this.categoryService.findOne(userId, id);
    if(!category) throw new NotFoundException('Category not found');
    return category;
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateCategoryDto){
    const userId = (req as any).user.sub;
    const category = await this.categoryService.update(userId, id, dto);
    if(!category) throw new NotFoundException('Category not found');
    return category;
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string){
    const userId = (req as any).user.sub;
    const category = await this.categoryService.delete(userId, id);
    if(!category) throw new NotFoundException('Category not found');
    return { message: 'Category deleted' };
  }
}
