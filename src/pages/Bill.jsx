import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, SkipForward } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { bills, fmt } from '../data/mock';

const TAB_LABELS = ['Semua', 'Upcoming', 'Due Soon', 'Overdue', 'Paid'];

function getBillColor(status) {
  if (status === 'overdue') return 'red';
  if (status === 'due_soon') return 'yellow';
  if (status === 'paid') return 'green';
  return 'muted';
}
function getBillLabel(status) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'due_soon') return 'Due Soon';
  if (status === 'paid') return 'Paid';
  return 'Upcoming';
}

export default function Bill() {
  const [tab, setTab] = useState('Semua');
  const [showModal, setShowModal] = useState(false);

  const totalMonth = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0);
  const upcoming = bills.filter(b => b.status === 'upcoming').length;
  const overdue = bills.filter(b => b.status === 'overdue').length;

  const filtered = tab === 'Semua' ? bills
    : tab === 'Upcoming' ? bills.filter(b => b.status === 'upcoming')
    : tab === 'Due Soon' ? bills.filter(b => b.status === 'due_soon')
    : tab === 'Overdue' ? bills.filter(b => b.status === 'overdue')
    : bills.filter(b => b.status === 'paid');

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Bills (Tagihan Berulang)</h1>
          <p className="page-subtitle">Pantau semua tagihan rutin kamu</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Tambah Tagihan</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-card-label">Total Bulan Ini</div><div className="stat-card-value">{fmt(totalMonth)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Upcoming</div><div className="stat-card-value" style={{ color: 'var(--blue)' }}>{upcoming}</div></div>
        <div className="stat-card"><div className="stat-card-label">Overdue</div><div className="stat-card-value" style={{ color: 'var(--red)' }}>{overdue}</div></div>
      </div>

      <div className="tabs">
        {TAB_LABELS.map(t => <button key={t} className={`tab${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(b => (
          <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: 28, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: 10 }}>{b.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color="muted">{b.frequency}</Badge>
                <Badge color="accent">{b.category}</Badge>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jatuh tempo: {b.nextDue}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(b.amount)}</div>
              <Badge color={getBillColor(b.status)}>{getBillLabel(b.status)}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {b.status !== 'paid' && <button className="btn btn-success btn-sm"><CheckCircle size={12} /> Bayar</button>}
              <button className="btn btn-secondary btn-icon btn-sm"><SkipForward size={12} /></button>
              <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
              <button className="btn btn-danger btn-icon btn-sm"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Tambah Tagihan" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Tambah</button></>}>
          <div className="form-group"><label className="form-label">Nama Tagihan</label><input className="form-input" placeholder="e.g. Netflix" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Jumlah (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Frekuensi</label><select className="form-input"><option>Monthly</option><option>Weekly</option><option>Yearly</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Tanggal Mulai</label><input className="form-input" type="date" /></div>
            <div className="form-group"><label className="form-label">Kategori</label><select className="form-input"><option>Entertainment</option><option>Utilities</option><option>Health</option><option>Transport</option></select></div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
