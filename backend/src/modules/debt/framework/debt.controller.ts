import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/core/app/jwt-auth-guard.js';
import { DebtService } from '../core/app/debt.service.js';
import { CreateDebtDto } from './dtos/create-debt.dto.js';
import { UpdateDebtDto } from './dtos/update-debt.dto.js';

@Controller('debt')
@UseGuards(JwtAuthGuard) 
export class DebtController {

    constructor(
        private readonly debtService: DebtService,
    ){}

    @Post()
    async create(
        @Body() dto: CreateDebtDto,
    ){
        return this.debtService.create(dto);
    }

    @Post('/budget-ids')
    async findAllByBudgetIds(
        @Body() budgetIds: string[],
    ){
        return this.debtService.findByBudgetIds(budgetIds);
    }

    @Get(':budgetId')
    async findOneByBudgetId(
        @Param('budgetId') budgetId: string,
    ){
        return this.debtService.findOneByBudgetId(budgetId);
    }

    @Get('/id/:id')
    async findOne(
        @Param('id') id: string,
    ){
        return this.debtService.findOne(id);
    }

     @Put('/update/:id')
     async update(
        @Param('id') id: string,
        @Body() dto: UpdateDebtDto,
     ){
        return this.debtService.update(id, dto);
     }

     @Delete('/delete/:id')
     async delete(
        @Param('id') id: string,
     ){
        return this.debtService.delete(id);
     }

}

