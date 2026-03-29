import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateCategoryDto } from './create-category.dto.js';
import { UpdateCategoryDto } from './update-category.dto.js';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto){
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
      },
    });
  }

  async findAll(userId: string){
    return this.prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string){
    return this.prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto){
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if(!category) return null;

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
      },
    });
  }

  async delete(userId: string, id: string){
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if(!category) return null;

    return this.prisma.category.delete({
      where: { id },
    });
  }
}