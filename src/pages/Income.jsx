import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { incomeTransactions, trendData, fmt } from '../data/mock';

const FILTERS = ['Day', 'Month', 'Year'];
const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);

export default function Income() {
  const [filter, setFilter] = useState('Month');
  const [showModal, setShowModal] = useState(false);

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">Semua sumber pemasukan kamu</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Tambah Income</button>
      </div>

      {/* Stats */}
      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Pemasukan</div>
          <div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(totalIncome)}</div>
          <div className="stat-card-sub">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Transaksi</div>
          <div className="stat-card-value">{incomeTransactions.length}</div>
          <div className="stat-card-sub">Total entri</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rata-rata</div>
          <div className="stat-card-value">{fmt(Math.round(totalIncome / incomeTransactions.length))}</div>
          <div className="stat-card-sub">Per transaksi</div>
        </div>
      </div>

      {/* Filter + Chart */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Tren Pemasukan</span>
          <div className="filter-bar">
            {FILTERS.map(f => <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
        </div>
        <div className="card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="month" tick={{ fill: '#9090b0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
                <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f0f0ff', fontSize: 12 }} formatter={v => fmt(v)} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#gi)" strokeWidth={2} name="Pemasukan" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="section">
        <div className="section-header"><span className="section-title">Daftar Transaksi</span></div>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Sumber</th><th>Jumlah</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {incomeTransactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.description}</td>
                    <td><Badge color="green">{t.category}</Badge></td>
                    <td>{t.source}</td>
                    <td className="amount-green">{fmt(t.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
                        <button className="btn btn-danger btn-icon btn-sm"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination" style={{ padding: '12px 0' }}>
            {[1,2,3].map(p => <button key={p} className={`page-btn${p===1?' active':''}`}>{p}</button>)}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Tambah Pemasukan" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Simpan</button></>}>
          <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" placeholder="e.g. Gaji Bulanan" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Jumlah (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Tanggal</label><input className="form-input" type="date" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Kategori</label><select className="form-input"><option>Salary</option><option>Freelance</option><option>Investment</option><option>Bonus</option><option>Other</option></select></div>
            <div className="form-group"><label className="form-label">Sumber Akun</label><select className="form-input"><option>BCA Tabungan</option><option>GoPay</option><option>OVO</option><option>Mandiri</option></select></div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
