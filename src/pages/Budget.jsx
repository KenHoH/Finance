import { useState } from 'react';
import { Plus, Edit2, Eye, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { budgets, fmt } from '../data/mock';

export default function Budget() {
  const [showModal, setShowModal] = useState(false);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Kelola batas pengeluaran per kategori</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Buat Budget</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-card-label">Total Budget</div><div className="stat-card-value">{fmt(totalBudget)}</div><div className="stat-card-sub">Bulan ini</div></div>
        <div className="stat-card"><div className="stat-card-label">Total Dipakai</div><div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(totalSpent)}</div><div className="stat-card-sub">{Math.round((totalSpent/totalBudget)*100)}% dari budget</div></div>
        <div className="stat-card"><div className="stat-card-label">Sisa Budget</div><div className="stat-card-value" style={{ color: totalRemaining < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(totalRemaining)}</div></div>
      </div>

      <div className="grid-auto">
        {budgets.map(b => {
          const pct = Math.round((b.spent / b.budget) * 100);
          const over = pct >= 100;
          const warn = pct >= b.threshold;
          return (
            <div key={b.id} className="card" style={{ borderColor: over ? 'var(--red)' : warn ? 'var(--yellow)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.category}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.period}</div>
                  </div>
                </div>
                {over ? <Badge color="red">Over Budget</Badge> : warn ? <Badge color="yellow">Hampir Limit</Badge> : <Badge color="green">Aman</Badge>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Dipakai: <strong style={{ color: 'var(--text-primary)' }}>{fmt(b.spent)}</strong></span>
                <span><strong style={{ color: 'var(--accent)' }}>{pct}%</strong></span>
              </div>
              <ProgressBar percent={pct} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Sisa: {fmt(b.budget - b.spent)}</span>
                <span>Budget: {fmt(b.budget)}</span>
              </div>
              {warn && !over && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--yellow)', background: 'var(--yellow-soft)', padding: '6px 10px', borderRadius: 6 }}>
                  <AlertTriangle size={12} /> Alert threshold {b.threshold}% tercapai
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Eye size={12} /> Detail</button>
                <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Buat Budget Baru" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Buat Budget</button></>}>
          <div className="form-group"><label className="form-label">Kategori</label><select className="form-input"><option>Food</option><option>Transport</option><option>Entertainment</option><option>Utilities</option><option>Health</option><option>Education</option></select></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Budget (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Alert Threshold (%)</label><input className="form-input" type="number" placeholder="80" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Mulai</label><input className="form-input" type="date" /></div>
            <div className="form-group"><label className="form-label">Selesai</label><input className="form-input" type="date" /></div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
