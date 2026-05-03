import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateDebtDto } from '../../framework/dtos/create-debt.dto.js';
import { UpdateDebtDto } from '../../framework/dtos/update-debt.dto.js';

@Injectable()
export class DebtService {

    constructor(
        private readonly prisma: PrismaService,
    ){}

    async create(dto: CreateDebtDto) {
        const debt = await this.prisma.debtPoint.create({
            data: {
                budgetId: dto.budgetId,
                debtAmount: dto.debtAmount,
            }
        })

        return debt;
    }   
    
    // Used to get sum of total debts, by using budget Ids that contains userId on it
    async findByBudgetIds(budgetIds: string[]){
        const debts = await this.prisma.debtPoint.findMany({
            where: {
                budgetId: {in: budgetIds},
            }
        })

        return debts;
    }

    async findOneByBudgetId(budgetId: string){
        const debt = await this.prisma.debtPoint.findFirst({
            where: {
                budget: {
                    id: budgetId,
                }
            }
        })
        return debt;
    }

    async findOne(id: string){
        const debt = await this.prisma.debtPoint.findFirst({
            where: {
                id: id,
            }
        })
        return debt;
    }

    async update(id: string, dto: UpdateDebtDto){
        const debt = await this.prisma.debtPoint.findFirst({
            where: { id },
        });

        if(!debt) return null;

        // check if the budget is really exists or not
        const budget = await this.prisma.budget.findFirst({
            where: { id: dto.budgetId },
        });

        if(!budget) return null;

        return this.prisma.debtPoint.update({
            where: {id},
            data: {
                debtAmount: dto.debtAmount,
                budgetId: dto.budgetId,
            }
        });
    }

    async delete(id: string){
        const debt = await this.prisma.debtPoint.findFirst({
            where: { id },
        });

        if(!debt) return null;

        return this.prisma.debtPoint.delete({
            where: { id },
        });
    }

}
