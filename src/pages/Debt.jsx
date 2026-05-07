import { Eye } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { debts, fmt } from '../data/mock';

export default function Debt() {
  const totalDebt = debts.reduce((s, d) => s + d.debt, 0);
  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Debt (Defisit Budget)</h1>
        <p className="page-subtitle">Budget yang sudah melebihi batas pengeluaran</p>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
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
          <div className="stat-card-value">{(debts.reduce((s,d) => s+d.overspendPct,0)/debts.length).toFixed(1)}%</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span className="section-title">Daftar Defisit Budget</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {debts.map(d => (
            <div key={d.id} className="card" style={{ borderColor: 'var(--red)', borderLeftWidth: 3, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.budgetName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overspend sebesar {d.overspendPct}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Budget</div>
                <div style={{ fontWeight: 600 }}>{fmt(d.budgetAmount)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dipakai</div>
                <div style={{ fontWeight: 600, color: 'var(--yellow)' }}>{fmt(d.spent)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Defisit</div>
                <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 16 }}>-{fmt(d.debt)}</div>
              </div>
              <button className="btn btn-secondary btn-sm"><Eye size={12} /> Detail</button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
