import { useState } from 'react';
import { Plus, Edit2, Pause, Play, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { savings, fmt } from '../data/mock';

export default function Saving() {
  const [showModal, setShowModal] = useState(false);
  const totalSaved = savings.reduce((s, sv) => s + sv.current, 0);
  const totalTarget = savings.reduce((s, sv) => s + sv.target, 0);
  const monthlyRate = savings.filter(s => s.autoDeposit).reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Saving</h1>
          <p className="page-subtitle">Kelola tabunganmu dengan disiplin</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Buat Tabungan</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-card-label">Total Tabungan</div><div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(totalSaved)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Total Target</div><div className="stat-card-value">{fmt(totalTarget)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Auto-Deposit / Bulan</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{fmt(monthlyRate)}</div></div>
      </div>

      <div className="grid-auto">
        {savings.map(sv => {
          const pct = Math.round((sv.current / sv.target) * 100);
          return (
            <div key={sv.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>💰 {sv.name}</div>
                <Badge color={sv.autoDeposit ? 'green' : 'muted'}>{sv.autoDeposit ? 'Auto On' : 'Manual'}</Badge>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{fmt(sv.current)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Target: {fmt(sv.target)}</div>
              <ProgressBar percent={pct} color="green" />
              <div style={{ textAlign: 'right', fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>{pct}%</div>
              {sv.autoDeposit && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, background: 'var(--green-soft)', padding: '6px 10px', borderRadius: 6 }}>
                  🔁 Auto {sv.frequency}: {fmt(sv.amount)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }}><ArrowDownCircle size={12} /> Deposit</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }}><ArrowUpCircle size={12} /> Tarik</button>
                <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
                <button className="btn btn-secondary btn-icon btn-sm">{sv.autoDeposit ? <Pause size={12} /> : <Play size={12} />}</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Buat Tabungan Baru" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Buat</button></>}>
          <div className="form-group"><label className="form-label">Nama Tabungan</label><input className="form-input" placeholder="e.g. Tabungan Lebaran" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Target (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Auto-Deposit</label><select className="form-input"><option>Tidak</option><option>Weekly</option><option>Monthly</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Jumlah Auto-Deposit</label><input className="form-input" type="number" placeholder="0" /></div>
        </Modal>
      )}
    </AppLayout>
  );
}
