import { useState } from 'react';
import { Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { goals, fmt } from '../data/mock';

const statusColor = { active: 'blue', completed: 'green', expired: 'red' };

export default function Goals() {
  const [showModal, setShowModal] = useState(false);
  const active = goals.filter(g => g.status === 'active').length;
  const completed = goals.filter(g => g.status === 'completed').length;

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Wujudkan impianmu satu per satu</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Buat Goal</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-card-label">Total Goals</div><div className="stat-card-value">{goals.length}</div></div>
        <div className="stat-card"><div className="stat-card-label">Aktif</div><div className="stat-card-value" style={{ color: 'var(--blue)' }}>{active}</div></div>
        <div className="stat-card"><div className="stat-card-label">Selesai</div><div className="stat-card-value" style={{ color: 'var(--green)' }}>{completed}</div></div>
      </div>

      <div className="grid-auto">
        {goals.map(g => {
          const pct = Math.round((g.current / g.target) * 100);
          return (
            <div key={g.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{g.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{g.description}</div>
                  </div>
                </div>
                <Badge color={statusColor[g.status]}>{g.status}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
              </div>
              <ProgressBar percent={pct} color="accent" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{fmt(g.current)}</span><span>{fmt(g.target)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>⏳ Deadline: {g.deadline}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }}><PlusCircle size={12} /> Tambah Dana</button>
                <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
                <button className="btn btn-danger btn-icon btn-sm"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Buat Goal Baru" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Buat Goal</button></>}>
          <div className="form-group"><label className="form-label">Nama Goal</label><input className="form-input" placeholder="e.g. Rumah Impian" /></div>
          <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" placeholder="Opsional" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Target (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" /></div>
          </div>
          <div className="form-group"><label className="form-label">Auto-alokasi bulanan (opsional)</label><input className="form-input" type="number" placeholder="Jumlah per bulan" /></div>
        </Modal>
      )}
    </AppLayout>
  );
}
