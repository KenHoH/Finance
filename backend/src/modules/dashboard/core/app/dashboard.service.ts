import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, month?: number, year?: number){
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    const dateFilter = {
      userId,
      date: { gte: startDate, lte: endDate },
    };

    const [incomeAgg, expenseAgg, byCategory, recentTransactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...dateFilter, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...dateFilter, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...dateFilter, type: 'EXPENSE' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount || 0);
    const totalExpense = Number(expenseAgg._sum.amount || 0);

    const categoryIds = byCategory
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = categoryIds.length > 0
      ? await this.prisma.category.findMany({
          where: { id: { in: categoryIds } },
        })
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const spendingByCategory = byCategory.map((g) => ({
      categoryId: g.categoryId,
      categoryName: g.categoryId ? categoryMap.get(g.categoryId) || 'Unknown' : 'Uncategorized',
      total: g._sum.amount || 0,
    }));

    return {
      month: m,
      year: y,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      spendingByCategory,
      recentTransactions,
    };
  }
}
