import { Eye } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { budgets as mockBudgets, expenseTransactions, fmt } from '../data/mock';
import { BUDGET_STORAGE_KEY, EXPENSE_STORAGE_KEY, deriveDebts, readList } from '../lib/localFinance';

export default function Debt() {
  const budgets = readList(BUDGET_STORAGE_KEY, mockBudgets);
  const expenses = readList(EXPENSE_STORAGE_KEY, expenseTransactions);
  const debts = deriveDebts(budgets, expenses);
  const totalDebt = debts.reduce((sum, debt) => sum + debt.debt, 0);
  const averageOverspend = debts.length ? (debts.reduce((sum, debt) => sum + debt.overspendPct, 0) / debts.length).toFixed(1) : '0.0';

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Debt</h1>
        <p className="page-subtitle">Defisit dihitung otomatis dari Budget dan Expenses terbaru.</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">Total Defisit</div>
          <div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(totalDebt)}</div>
          <div className="stat-card-sub">Dari semua budget</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Budget Over</div>
          <div className="stat-card-value" style={{ color: 'var(--yellow)' }}>{debts.length}</div>
          <div className="stat-card-sub">Kategori bermasalah</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rata-rata Overspend</div>
          <div className="stat-card-value">{averageOverspend}%</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span className="section-title">Daftar Defisit Budget</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {debts.length === 0 && (
            <div className="card" style={{ color: 'var(--text-secondary)' }}>Belum ada budget yang melewati batas.</div>
          )}
          {debts.map((debt) => (
            <div key={debt.id} className="card responsive-row" style={{ borderColor: 'var(--red)', borderLeftWidth: 3 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{debt.budgetName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overspend sebesar {debt.overspendPct}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Budget</div>
                <div style={{ fontWeight: 600 }}>{fmt(debt.budgetAmount)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dipakai</div>
                <div style={{ fontWeight: 600, color: 'var(--yellow)' }}>{fmt(debt.spent)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Defisit</div>
                <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 16 }}>-{fmt(debt.debt)}</div>
              </div>
              <button className="btn btn-secondary btn-sm"><Eye size={12} /> Detail</button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
