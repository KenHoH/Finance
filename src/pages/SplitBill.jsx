import { useState } from 'react';
import { Plus, CheckCircle, Upload, Eye } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { splitBills, fmt } from '../data/mock';

const TABS = ['Semua', 'I Owe Them', 'They Owe Me'];

function statusColor(s) {
  if (s === 'SETTLED') return 'green';
  if (s === 'PARTIALLY_PAID') return 'yellow';
  return 'red';
}

export default function SplitBill() {
  const [tab, setTab] = useState('Semua');
  const [showModal, setShowModal] = useState(false);

  const iOweTotal = splitBills.reduce((sum, sb) => {
    const me = sb.participants.find(p => p.name === 'Me');
    return sum + (me && !me.paid ? me.amount : 0);
  }, 0);
  const theyOweTotal = splitBills.reduce((sum, sb) => {
    if (sb.creator !== 'Me') return sum;
    return sum + sb.participants.filter(p => p.name !== 'Me' && !p.paid).reduce((s, p) => s + p.amount, 0);
  }, 0);

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Split Bill</h1>
          <p className="page-subtitle">Kelola tagihan bersama teman</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Buat Split</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-card-label">Saya Hutang</div><div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(iOweTotal)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Saya Ditagih</div><div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(theyOweTotal)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Net Balance</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{fmt(theyOweTotal - iOweTotal)}</div></div>
      </div>

      <div className="tabs">
        {TABS.map(t => <button key={t} className={`tab${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {splitBills.map(sb => (
          <div key={sb.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{sb.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sb.date}</span>
                  <Badge color="muted">by {sb.creator}</Badge>
                  <Badge color={statusColor(sb.status)}>{sb.status.replace('_',' ')}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(sb.total)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sb.participants.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8 }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{p.name.slice(0,2).toUpperCase()}</div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(p.amount)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: p.paid ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {p.paid ? <CheckCircle size={12} /> : '⏳'} {p.paid ? 'Lunas' : 'Pending'}
                  </span>
                  {!p.paid && p.name !== 'Me' && <button className="btn btn-success btn-sm" style={{ padding: '3px 8px', fontSize: 11 }}>Mark Paid</button>}
                  <button className="btn btn-secondary btn-icon btn-sm" style={{ padding: '3px 6px' }}><Upload size={10} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary btn-sm"><Eye size={12} /> Detail</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Buat Split Bill" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Buat Split</button></>}>
          <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" placeholder="e.g. Dinner di Resto" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Total (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Tanggal</label><input className="form-input" type="date" /></div>
          </div>
          <div className="form-group"><label className="form-label">Tambah Peserta (dari teman)</label><input className="form-input" placeholder="Cari nama teman..." /></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>Split akan dibagi rata otomatis, atau kamu bisa set manual per orang.</div>
        </Modal>
      )}
    </AppLayout>
  );
}
