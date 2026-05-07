import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { investments, fmt } from '../data/mock';
import Logo from '../components/ui/Logo';

export default function Investment() {
  const [showModal, setShowModal] = useState(false);
  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const totalValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalGain = totalValue - totalInvested;

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Investasi</h1>
          <p className="page-subtitle">Pantau portofolio investasimu</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Tambah Investasi</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-label">Nilai Portfolio</div>
          <div className="stat-card-value" style={{ fontSize: 22 }}>{fmt(totalValue)}</div>
          <div className="stat-card-sub">Total aset saat ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Gain/Loss</div>
          <div className="stat-card-value" style={{ color: totalGain >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 22 }}>
            {totalGain >= 0 ? '+' : ''}{fmt(totalGain)}
          </div>
          <div className="stat-card-sub">{((totalGain / totalInvested) * 100).toFixed(1)}% dari modal</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Modal</div>
          <div className="stat-card-value" style={{ fontSize: 22 }}>{fmt(totalInvested)}</div>
          <div className="stat-card-sub">Total diinvestasikan</div>
        </div>
      </div>

      <div className="grid-auto">
        {investments.map(inv => {
          const gain = inv.currentValue - inv.invested;
          const pct = ((gain / inv.invested) * 100).toFixed(2);
          const isUp = gain >= 0;
          return (
            <div key={inv.id} className="card" style={{ borderColor: isUp ? '#22c55e22' : '#ef444422' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, fontSize: 22,
                    background: isUp ? 'var(--green-soft)' : 'var(--red-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{inv.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{inv.name}</div>
                    <Badge color="muted">{inv.type}</Badge>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Nilai Sekarang</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(inv.currentValue)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Modal</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(inv.invested)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gain/Loss</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isUp ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {isUp ? '+' : ''}{fmt(gain)} ({isUp ? '+' : ''}{pct}%)
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Eye size={12} /> Detail</button>
                <button className="btn btn-primary btn-sm"><Plus size={12} /> Transaksi</button>
                <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
                <button className="btn btn-danger btn-icon btn-sm"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Tambah Investasi" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Tambah</button></>}>
          <div className="form-group"><label className="form-label">Nama Investasi</label><input className="form-input" placeholder="e.g. BBRI, Bitcoin" /></div>
          <Logo ticker="BBRI" alt="Logo BBRI" className="w-10 h-10 rounded-md mb-2" />
          <Logo ticker="BTC" alt="Logo Bitcoin" className="w-10 h-10 rounded-md mb-2" />
          <div className="form-row">
            <div className="form-group"><label className="form-label">Tipe</label><select className="form-input"><option>Saham</option><option>Reksa Dana</option><option>Crypto</option><option>Obligasi</option><option>Lainnya</option></select></div>
            <div className="form-group"><label className="form-label">Nilai Awal (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
          </div>
          <div className="form-group"><label className="form-label">Catatan</label><textarea className="form-input" rows={3} placeholder="Opsional..." /></div>
        </Modal>
      )}
    </AppLayout>
  );
}
