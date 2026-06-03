import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateCategoryDto } from '../../framework/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '../../framework/dtos/update-category.dto.js';
import { ActivityLogService } from '../../../activity-log/core/app/activity-log.service.js';
import { CategoryType } from '../../../../../generated/prisma/client.js';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(userId: string, dto: CreateCategoryDto){
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if(existing){
      throw new ConflictException('A category with this name already exists.');
    }

    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
      },
    });

    await this.activityLogService.logActivity(userId, 'CREATE', 'Category', category.id, {name: category.name, type: category.type});

    return category;
  }

  async findAll(userId: string, type?: string){
    return this.prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
        ...(type ? { type: type as CategoryType } : {}),
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

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
      },
    });

    await this.activityLogService.logActivity(userId, 'UPDATE', 'Category', id, {name: updated.name, type: updated.type});

    return updated;
  }

  async delete(userId: string, id: string){
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if(!category) return null;

    await this.activityLogService.logActivity(userId, 'DELETE', 'Category', id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}