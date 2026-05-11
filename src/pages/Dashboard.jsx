import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight, TrendingUp, TrendingDown, Target, PieChart, Landmark, Wallet } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import ProgressBar from '../components/ui/ProgressBar';
import Logo from '../components/ui/Logo';
import {
  accounts,
  goals as mockGoals,
  budgets as mockBudgets,
  investments,
  incomeTransactions,
  expenseTransactions,
  trendData,
  fmt,
} from '../data/mock';
import {
  BUDGET_STORAGE_KEY,
  EXPENSE_STORAGE_KEY,
  GOAL_STORAGE_KEY,
  INCOME_STORAGE_KEY,
  INVESTMENT_STORAGE_KEY,
  hydrateBudgets,
  normalizeInvestment,
  readList,
} from '../lib/localFinance';
import { loadBudgets, loadFromBackend, loadGoals, loadTransactions } from '../lib/backendFinance';

const FILTERS = ['Day', 'Month', 'Year'];

export default function Dashboard() {
  const [filter, setFilter] = useState('Month');
  const [portfolio] = useState(() => readList(INVESTMENT_STORAGE_KEY, investments).map(normalizeInvestment));
  const [incomeItems, setIncomeItems] = useState(() => readList(INCOME_STORAGE_KEY, incomeTransactions));
  const [expenseItems, setExpenseItems] = useState(() => readList(EXPENSE_STORAGE_KEY, expenseTransactions));
  const [goalItems, setGoalItems] = useState(() => readList(GOAL_STORAGE_KEY, mockGoals));
  const [budgetItems, setBudgetItems] = useState(() => readList(BUDGET_STORAGE_KEY, mockBudgets));
  const budgets = useMemo(() => hydrateBudgets(budgetItems, expenseItems), [budgetItems, expenseItems]);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([
      loadFromBackend(() => loadTransactions('INCOME'), incomeItems),
      loadFromBackend(() => loadTransactions('EXPENSE'), expenseItems),
      loadFromBackend(() => loadGoals(), goalItems),
      loadFromBackend(() => loadBudgets(), budgetItems),
    ]).then(([incomeResult, expenseResult, goalResult, budgetResult]) => {
      if (!active) return;
      setIncomeItems(incomeResult.data);
      setExpenseItems(expenseResult.data);
      setGoalItems(goalResult.data);
      setBudgetItems(budgetResult.data);
    });
    return () => { active = false; };
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang kembali. Ini ringkasan dari data terbaru yang kamu input.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--blue-soft))', borderColor: 'var(--border-light)' }}>
          <div className="stat-card-label">Total Saldo</div>
          <div className="stat-card-value" style={{ fontSize: 28 }}>{fmt(totalBalance)}</div>
          <div className="stat-card-sub">Semua akun & dompet</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-card-label" style={{ marginBottom: 0 }}>Total Pemasukan</div>
            <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{incomeItems.length} entri</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(totalIncome)}</div>
          <div className="stat-card-sub">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-card-label" style={{ marginBottom: 0 }}>Total Pengeluaran</div>
            <span style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{expenseItems.length} entri</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(totalExpense)}</div>
          <div className="stat-card-sub">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Net Saving</div>
          <div className="stat-card-value" style={{ color: 'var(--accent)' }}>{fmt(totalIncome - totalExpense)}</div>
          <div className="stat-card-sub">Pemasukan - Pengeluaran</div>
        </div>
      </div>

      {/* Accounts */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Akun & Dompet</span>
          <button className="btn btn-secondary btn-sm">Lihat Semua</button>
        </div>
        <div className="scroll-row">
          {accounts.map(a => (
            <div key={a.id} className="hscroll-card" style={{ minWidth: 180 }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{a.type}</div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(a.balance)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Tren Keuangan</span>
          <div className="filter-bar">
            {FILTERS.map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} formatter={v => fmt(v)} />
                <Area type="monotone" dataKey="income" stroke="var(--green)" fill="url(#gIncome)" strokeWidth={2} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="var(--red)" fill="url(#gExpense)" strokeWidth={2} name="Pengeluaran" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goals & Budget Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Goals */}
        <div>
          <div className="section-header">
            <span className="section-title"><Target size={14} style={{ display:'inline', marginRight:6 }} />Goals</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/goals')}>Detail <ChevronRight size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goalItems.slice(0, 3).map(g => {
              const pct = Math.round((g.current / g.target) * 100);
              return (
                <div key={g.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{g.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
                  </div>
                  <ProgressBar percent={pct} color="accent" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{fmt(g.current)}</span>
                    <span>{fmt(g.target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="section-header">
            <span className="section-title"><PieChart size={14} style={{ display:'inline', marginRight:6 }} />Budget</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/budget')}>Detail <ChevronRight size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {budgets.slice(0, 3).map(b => {
              const pct = Math.round((b.spent / b.budget) * 100);
              return (
                <div key={b.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{b.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{b.category}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)' }}>{pct}%</span>
                  </div>
                  <ProgressBar percent={pct} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{fmt(b.spent)}</span>
                    <span>{fmt(b.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Investments */}
      <div className="section">
        <div className="section-header">
          <span className="section-title"><Landmark size={14} style={{ display:'inline', marginRight:6 }} />Investasi</span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/investments')}>Detail <ChevronRight size={12} /></button>
        </div>
        <div className="scroll-row">
          {portfolio.map(inv => {
            const gain = inv.currentValue - inv.invested;
            const pct = ((gain / inv.invested) * 100).toFixed(1);
            return (
              <div key={inv.id} className="hscroll-card" style={{ minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Logo
                    ticker={inv.symbol}
                    name={inv.name}
                    type={inv.type}
                    domain={inv.logoDomain}
                    className="asset-logo asset-logo-sm"
                  />
                  <span className={`badge ${gain >= 0 ? 'badge-green' : 'badge-red'}`}>{gain >= 0 ? '+' : ''}{pct}%</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{inv.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{inv.type}</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(inv.currentValue)}</div>
                <div style={{ fontSize: 11, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {gain >= 0 ? '+' : ''}{fmt(gain)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
