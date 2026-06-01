import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from '../core/app/settings.service.js';
import { CreateSettingsDto } from './dtos/create-settings.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { EventsGateway } from '../../../infrastructure/gateway/events.gateway.js';
import { UpdateSettingsDto } from './dtos/update-settings.dto.js';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {

    constructor(
    private readonly settingsService: SettingsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

    @Post()
    async create(
        @Req() req,
        @Body() dto: CreateSettingsDto,
    ){
        const userId = (req as any).user.sub;
        return this.settingsService.upsert(userId, dto);
    }

    @Get()
    async findByUserId(
        @Req() req
    ) {
        const userId = (req as any).user.sub;
        return this.settingsService.findByUserId(userId);
    }

    @Get(':key')
    async findOneByKey(
        @Req() req,
        @Param('key') key: string,
    ) {
        const userId = (req as any).user.sub;
        return this.settingsService.findOneByKey(userId, key);
    }

    @Put(':key')
    async update(
        @Req() req,
        @Param('key') key: string,
        @Body() dto: UpdateSettingsDto
    ) {
        const userId = (req as any).user.sub;
        const setting = await this.settingsService.update(userId, key, dto.value);
        this.eventsGateway.emitToUser(userId, 'settings:updated', setting);
        return setting;
    }

    @Delete(':key')
    async delete(
        @Req() req,
        @Param('key') key: string,
    ) {
        const userId = (req as any).user.sub;
        await this.settingsService.delete(userId, key);
        this.eventsGateway.emitToUser(userId, 'settings:deleted', { key });
        return { message: 'Setting deleted' };
    }
}

