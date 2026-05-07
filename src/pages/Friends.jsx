import { useState } from 'react';
import { Plus, UserMinus, Split, Bell, Eye } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { friends, fmt } from '../data/mock';

export default function Friends() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.email.includes(search));

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Friends</h1>
          <p className="page-subtitle">Kelola pertemanan & split bill bersama</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Tambah Teman</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: 500 }}>
        <div className="stat-card"><div className="stat-card-label">Total Teman</div><div className="stat-card-value">{friends.length}</div></div>
        <div className="stat-card"><div className="stat-card-label">Split Aktif</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{friends.reduce((s,f) => s+f.activeSplits,0)}</div></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍  Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(f => (
          <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: 15 }}>{f.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{f.email}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge color="muted">{f.activeSplits} split aktif</Badge>
                {f.iOwe > 0 && <Badge color="red">Hutang {fmt(f.iOwe)}</Badge>}
                {f.theyOwe > 0 && <Badge color="green">Ditagih {fmt(f.theyOwe)}</Badge>}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginRight: 8 }}>
              <div>Berteman sejak</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{f.since}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm"><Eye size={12} /></button>
              <button className="btn btn-secondary btn-sm"><Split size={12} /> Split</button>
              <button className="btn btn-secondary btn-sm"><Bell size={12} /></button>
              <button className="btn btn-danger btn-icon btn-sm"><UserMinus size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Tambah Teman" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Kirim Permintaan</button></>}>
          <div className="form-group"><label className="form-label">Email / Username</label><input className="form-input" placeholder="email@gmail.com atau @username" /></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permintaan pertemanan akan dikirimkan. Setelah diterima, kamu bisa melihat rekening bank mereka.</div>
        </Modal>
      )}
    </AppLayout>
  );
}
