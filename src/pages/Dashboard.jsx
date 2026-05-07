import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight, TrendingUp, TrendingDown, Target, PieChart, Landmark, Wallet } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import ProgressBar from '../components/ui/ProgressBar';
import { accounts, goals, budgets, investments, trendData, fmt } from '../data/mock';

const FILTERS = ['Day', 'Month', 'Year'];

const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
const totalIncome = 15750000;
const totalExpense = 7400000;

export default function Dashboard() {
  const [filter, setFilter] = useState('Month');
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang kembali 👋 Ini ringkasan keuanganmu hari ini.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #6c63ff22, #a855f722)', borderColor: '#6c63ff44' }}>
          <div className="stat-card-label">Total Saldo</div>
          <div className="stat-card-value" style={{ fontSize: 28 }}>{fmt(totalBalance)}</div>
          <div className="stat-card-sub">Semua akun & dompet</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-card-label" style={{ marginBottom: 0 }}>Total Pemasukan</div>
            <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>↑ 12%</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(totalIncome)}</div>
          <div className="stat-card-sub">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-card-label" style={{ marginBottom: 0 }}>Total Pengeluaran</div>
            <span style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>↑ 8%</span>
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
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="month" tick={{ fill: '#9090b0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
                <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f0f0ff', fontSize: 12 }} formatter={v => fmt(v)} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#gIncome)" strokeWidth={2} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} name="Pengeluaran" />
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
            {goals.slice(0, 3).map(g => {
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
          {investments.map(inv => {
            const gain = inv.currentValue - inv.invested;
            const pct = ((gain / inv.invested) * 100).toFixed(1);
            return (
              <div key={inv.id} className="hscroll-card" style={{ minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{inv.icon}</span>
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
