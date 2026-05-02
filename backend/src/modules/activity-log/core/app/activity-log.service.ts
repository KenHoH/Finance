import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateActivityLogDto, FilterActivityLogDto } from '../../framework/dto/index.js';

@Injectable()
export class ActivityLogService{
  constructor(private readonly prisma: PrismaService){}

  async create(userId: string, dto: CreateActivityLogDto){
    return this.prisma.activityLog.create({
      data: {
        userId,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        details: dto.details,
      },
    });
  }

  async findAll(userId: string, filters: FilterActivityLogDto){
    const {entity, action, page = 1, limit = 20} = filters;
    const skip = (page - 1) * limit;

    const where: any = {userId};
    if(entity) where.entity = entity;
    if(action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: {createdAt: 'desc'},
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({where}),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string){
    return this.prisma.activityLog.findFirst({
      where: {id, userId},
    });
  }

  // Helper method for other services to log activity
  async logActivity(userId: string, action: string, entity: string, entityId?: string, details?: Record<string, any>){
    return this.prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  }
}
