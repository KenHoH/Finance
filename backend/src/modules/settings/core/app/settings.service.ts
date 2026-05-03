import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSettingsDto } from '../../framework/dtos/create-settings.dto.js';

@Injectable()
export class SettingsService {

    constructor(
        private readonly prisma: PrismaService,
    ){}

    async upsert(userId: string, dto: CreateSettingsDto){
        const setting = await this.prisma.settings.upsert({
            where: {
                userId_key: {
                    userId,
                    key: dto.key,
                }
            },
            update: {
                value: dto.value,
            },
            create: {
                userId,
                key: dto.key,
                value: dto.value,
            }
        })

        return setting;
    }

    async findByUserId(userId: string){
        const settings = await this.prisma.settings.findMany({
            where: {
                userId,
            }
        })
        return settings;
    }

    async findOneByKey(userId: string, key: string){
        const setting = await this.prisma.settings.findFirst({
            where: {
                userId,
                key: key,
            }
        })
        return setting;
    }

    async delete(userId: string, key: string){
        const setting = await this.prisma.settings.delete({
            where: {
                userId_key: {
                    userId,
                    key
                }
            }
        })
        return setting;
    }
}
