import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class ChatContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(userId: string, message: string): Promise<string> {
    const lower = message.toLowerCase();
    const sections: string[] = [];

    if(this.matches(lower, ['spend', 'expense', 'cost', 'buy', 'purchase', 'paid', 'spending', 'pengeluaran', 'belanja', 'beli', 'habis', 'keluar'])){
      const ctx = await this.getExpenseContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['income', 'earn', 'salary', 'receive', 'earning', 'pendapatan', 'pemasukan', 'gaji', 'terima', 'masuk'])){
      const ctx = await this.getIncomeContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['budget', 'anggaran', 'batas'])){
      const ctx = await this.getBudgetContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['goal', 'target', 'saving', 'tabungan', 'menabung', 'impian'])){
      const ctx = await this.getGoalContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['split bill', 'bill share', 'split', 'patungan', 'bagi', 'bayar bersama'])){
      const ctx = await this.getSplitBillContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['bill', 'due', 'payment', 'upcoming', 'tagihan', 'jatuhtempo', 'jatuh tempo', 'bayar'])){
      const ctx = await this.getBillContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['investment', 'stock', 'gold', 'fund', 'reksadana', 'investasi', 'saham', 'emas', 'deposito'])){
      const ctx = await this.getInvestmentContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(this.matches(lower, ['balance', 'net worth', 'overview', 'summary', 'status', 'saldo', 'keuangan', 'ringkasan', 'total'])){
      const ctx = await this.getOverviewContext(userId);
      if(ctx) sections.push(ctx);
    }

    if(sections.length === 0){
      return '';
    }

    return 'Financial Context:\n' + sections.join('\n');
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }

  private async getExpenseContext(userId: string): Promise<string> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expenses = await this.prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    if(expenses.length === 0) return '- No expenses recorded this month.';

    const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
    const byCategory = new Map<string, number>();
    expenses.forEach(t => {
      const name = t.category?.name || 'Uncategorized';
      byCategory.set(name, (byCategory.get(name) || 0) + Number(t.amount));
    });
    const topCats = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amt]) => `${name}: Rp ${amt.toLocaleString('id-ID')}`)
      .join(', ');

    return `- This month's expenses: Rp ${total.toLocaleString('id-ID')} (${expenses.length} transactions). Top categories: ${topCats}.`;
  }

  private async getIncomeContext(userId: string): Promise<string> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const incomes = await this.prisma.transaction.findMany({
      where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    if(incomes.length === 0) return '- No income recorded this month.';

    const total = incomes.reduce((s, t) => s + Number(t.amount), 0);
    return `- This month's income: Rp ${total.toLocaleString('id-ID')} (${incomes.length} transactions).`;
  }

  private async getBudgetContext(userId: string): Promise<string> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      include: { category: true },
    });

    if(budgets.length === 0) return '- No active budgets.';

    const lines = await Promise.all(budgets.map(async b => {
      const spentAgg = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, type: 'EXPENSE', categoryId: b.categoryId || undefined, date: { gte: b.startDate, lte: b.endDate } },
      });
      const spent = Number(spentAgg._sum?.amount || 0);
      const limit = Number(b.amount);
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const name = b.category?.name || 'Overall';
      return `${name}: Rp ${spent.toLocaleString('id-ID')} / Rp ${limit.toLocaleString('id-ID')} (${pct}%)`;
    }));

    return `- Active budgets: ${lines.join('; ')}.`;
  }

  private async getGoalContext(userId: string): Promise<string> {
    const goals = await this.prisma.goal.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      orderBy: { deadline: 'asc' },
    });

    if(goals.length === 0) return '- No active goals.';

    const lines = goals.map(g => {
      const current = Number(g.currentAmount);
      const target = Number(g.targetAmount);
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      return `${g.name}: Rp ${current.toLocaleString('id-ID')} / Rp ${target.toLocaleString('id-ID')} (${pct}%)`;
    });

    return `- Active goals: ${lines.join('; ')}.`;
  }

  private async getSplitBillContext(userId: string): Promise<string> {
    const created = await this.prisma.splitBill.findMany({
      where: { creatorId: userId, status: 'PENDING' },
      include: { participants: true },
    });

    const participated = await this.prisma.splitParticipant.findMany({
      where: { userId, status: 'PENDING' },
      include: { splitBill: true },
    });

    const createdOwed = created.reduce((s, b) => s + Number(b.totalAmount), 0);
    const oweOthers = participated.reduce((s, p) => s + Number(p.amountOwed), 0);

    let lines: string[] = [];
    if(created.length > 0){
      lines.push(`${created.length} pending bills created by you (total Rp ${createdOwed.toLocaleString('id-ID')})`);
    }
    if(participated.length > 0){
      lines.push(`You owe Rp ${oweOthers.toLocaleString('id-ID')} in ${participated.length} pending split bills`);
    }

    if(lines.length === 0) return '- No pending split bills.';
    return `- Split bills: ${lines.join('; ')}.`;
  }

  private async getBillContext(userId: string): Promise<string> {
    const bills = await this.prisma.bill.findMany({
      where: { userId, status: 'PENDING', dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    if(bills.length === 0) return '- No upcoming bills.';

    const total = bills.reduce((s, b) => s + Number(b.amount), 0);
    return `- Upcoming bills: ${bills.length} pending (total Rp ${total.toLocaleString('id-ID')}). Next due: ${bills[0].title} on ${bills[0].dueDate.toISOString().split('T')[0]}.`;
  }

  private async getInvestmentContext(userId: string): Promise<string> {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: { category: true },
    });

    if(investments.length === 0) return '- No investments recorded.';

    const total = investments.reduce((s, i) => s + Number(i.totalAmount), 0);
    const lines = investments.map(i => `${i.category?.name || 'Unknown'}: Rp ${Number(i.totalAmount).toLocaleString('id-ID')}`);
    return `- Investments: total Rp ${total.toLocaleString('id-ID')}. Breakdown: ${lines.join(', ')}.`;
  }

  private async getOverviewContext(userId: string): Promise<string> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [incomeAgg, expenseAgg, budgetCount, goalCount, billCount] = await Promise.all([
      this.prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: 'INCOME', date: { gte: startOfMonth } } }),
      this.prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: 'EXPENSE', date: { gte: startOfMonth } } }),
      this.prisma.budget.count({ where: { userId } }),
      this.prisma.goal.count({ where: { userId, status: 'IN_PROGRESS' } }),
      this.prisma.bill.count({ where: { userId, status: 'PENDING', dueDate: { gte: now } } }),
    ]);

    const income = Number(incomeAgg._sum?.amount || 0);
    const expense = Number(expenseAgg._sum?.amount || 0);
    const net = income - expense;

    return `- Overview: Income Rp ${income.toLocaleString('id-ID')}, Expenses Rp ${expense.toLocaleString('id-ID')}, Net Rp ${net.toLocaleString('id-ID')}. Active budgets: ${budgetCount}, Goals in progress: ${goalCount}, Upcoming bills: ${billCount}.`;
  }
}
