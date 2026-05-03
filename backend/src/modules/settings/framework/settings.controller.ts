import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from '../core/app/settings.service.js';
import { CreateSettingsDto } from './dtos/create-settings.dto.js';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {

    constructor(
        private readonly settingsService: SettingsService,
    ){}

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

    @Delete(':key')
    async delete(
        @Req() req,
        @Param('key') key: string,
    ) {
        const userId = (req as any).user.sub;
        return this.settingsService.delete(userId, key);
    }
}
