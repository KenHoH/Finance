import { useState } from 'react';
import { Plus, Edit2, Trash2, Split } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { expenseTransactions, trendData, expensePieData, fmt } from '../data/mock';

const FILTERS = ['Day', 'Month', 'Year'];
const total = expenseTransactions.reduce((s, t) => s + t.amount, 0);

export default function Expenses() {
  const [filter, setFilter] = useState('Month');
  const [showModal, setShowModal] = useState(false);

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Pantau pengeluaranmu setiap saat</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Tambah Pengeluaran</button>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Pengeluaran</div>
          <div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(total)}</div>
          <div className="stat-card-sub">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">vs Bulan Lalu</div>
          <div className="stat-card-value" style={{ color: 'var(--yellow)' }}>+8.2%</div>
          <div className="stat-card-sub">Naik dari {fmt(6840000)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Kategori Terbesar</div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>Utilities</div>
          <div className="stat-card-sub">{fmt(1620000)}</div>
        </div>
      </div>

      <div className="grid-2 section">
        <div>
          <div className="section-header">
            <span className="section-title">Tren Pengeluaran</span>
            <div className="filter-bar">
              {FILTERS.map(f => <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>{f}</button>)}
            </div>
          </div>
          <div className="card">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="month" tick={{ fill: '#9090b0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f0f0ff', fontSize: 12 }} formatter={v => fmt(v)} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#ge)" strokeWidth={2} name="Pengeluaran" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <div className="section-header"><span className="section-title">Per Kategori</span></div>
          <div className="card">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {expensePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f0f0ff', fontSize: 12 }} formatter={v => fmt(v)} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#9090b0', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span className="section-title">Daftar Transaksi</span></div>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Metode</th><th>Sumber</th><th>Jumlah</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {expenseTransactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.description}</td>
                    <td><Badge color="red">{t.category}</Badge></td>
                    <td><Badge color="muted">{t.method}</Badge></td>
                    <td>{t.source}</td>
                    <td className="amount-red">{fmt(t.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-icon btn-sm"><Edit2 size={11} /></button>
                        <button className="btn btn-danger btn-icon btn-sm"><Trash2 size={11} /></button>
                        <button className="btn btn-secondary btn-icon btn-sm" title="Split Bill"><Split size={11} /></button>
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
        <Modal title="Tambah Pengeluaran" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary">Simpan</button></>}>
          <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" placeholder="e.g. Makan Siang" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Jumlah (IDR)</label><input className="form-input" type="number" placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Tanggal</label><input className="form-input" type="date" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Kategori</label><select className="form-input"><option>Food</option><option>Transport</option><option>Entertainment</option><option>Utilities</option><option>Health</option><option>Education</option></select></div>
            <div className="form-group"><label className="form-label">Metode Bayar</label><select className="form-input"><option>Cash</option><option>Transfer</option><option>GoPay</option><option>OVO</option><option>Kartu Kredit</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Akun Sumber</label><select className="form-input"><option>BCA Tabungan</option><option>GoPay</option><option>OVO</option><option>Mandiri</option></select></div>
        </Modal>
      )}
    </AppLayout>
  );
}
