import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Split, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { accounts, expenseTransactions, trendData, fmt } from '../data/mock';
import { EXPENSE_STORAGE_KEY, readList, todayInputValue, toRupiahNumber, uniqueByField, writeList } from '../lib/localFinance';
import { deleteTransaction as deleteBackendTransaction, loadFromBackend, loadTransactions, saveTransaction } from '../lib/backendFinance';

const FILTERS = ['Day', 'Month', 'Year'];
const CATEGORY_OPTIONS = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Education'];
const METHOD_OPTIONS = ['Cash', 'Transfer', 'GoPay', 'OVO', 'Dana', 'Kartu Kredit'];
const CATEGORY_COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#22c55e', '#6c63ff', '#14b8a6', '#f97316'];

function blankForm() {
  return {
    description: '',
    amount: '',
    date: todayInputValue(),
    category: 'Food',
    customCategory: '',
    method: 'Cash',
    customMethod: '',
    source: accounts[0]?.name || '',
    customSource: '',
  };
}

export default function Expenses() {
  const [transactions, setTransactions] = useState(() => readList(EXPENSE_STORAGE_KEY, expenseTransactions));
  const [filter, setFilter] = useState('Month');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    let active = true;
    loadFromBackend(() => loadTransactions('EXPENSE'), readList(EXPENSE_STORAGE_KEY, expenseTransactions)).then(({ data, connected }) => {
      if (!active) return;
      setBackendConnected(connected);
      setTransactions(data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    writeList(EXPENSE_STORAGE_KEY, transactions);
  }, [transactions]);

  const total = useMemo(() => transactions.reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const categoryOptions = useMemo(() => uniqueByField(transactions, 'category', CATEGORY_OPTIONS), [transactions]);
  const methodOptions = useMemo(() => uniqueByField(transactions, 'method', METHOD_OPTIONS), [transactions]);
  const sourceOptions = useMemo(() => uniqueByField(transactions, 'source', accounts.map((account) => account.name)), [transactions]);
  const categoryBreakdown = useMemo(() => {
    const totals = transactions.reduce((grouped, item) => {
      grouped[item.category] = (grouped[item.category] || 0) + item.amount;
      return grouped;
    }, {});
    return Object.entries(totals).map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [transactions]);
  const largestCategory = categoryBreakdown.reduce((largest, item) => (item.value > largest.value ? item : largest), { name: '-', value: 0 });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setEditingId(transaction.id);
    setForm({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      category: categoryOptions.includes(transaction.category) ? transaction.category : 'Other',
      customCategory: categoryOptions.includes(transaction.category) ? '' : transaction.category,
      method: methodOptions.includes(transaction.method) ? transaction.method : 'Other',
      customMethod: methodOptions.includes(transaction.method) ? '' : transaction.method,
      source: sourceOptions.includes(transaction.source) ? transaction.source : 'Other',
      customSource: sourceOptions.includes(transaction.source) ? '' : transaction.source,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(blankForm());
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const upsertTransaction = (nextTransaction) => {
    setTransactions((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? nextTransaction : item));
      }
      return [nextTransaction, ...current];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = toRupiahNumber(form.amount);
    const description = form.description.trim();
    if (!description || !amount || !form.date) return;

    const nextTransaction = {
      id: editingId || Date.now(),
      date: form.date,
      description,
      category: form.category === 'Other' && form.customCategory.trim() ? form.customCategory.trim() : form.category,
      amount,
      method: form.method === 'Other' && form.customMethod.trim() ? form.customMethod.trim() : form.method,
      source: form.source === 'Other' && form.customSource.trim() ? form.customSource.trim() : form.source,
    };

    if (backendConnected) {
      try {
        const saved = await saveTransaction('EXPENSE', nextTransaction);
        upsertTransaction({ ...saved, method: nextTransaction.method });
      } catch {
        setBackendConnected(false);
        upsertTransaction(nextTransaction);
      }
    } else {
      upsertTransaction(nextTransaction);
    }
    closeModal();
  };

  const deleteTransaction = async (id) => {
    if (backendConnected && String(id).includes('-')) {
      try {
        await deleteBackendTransaction(id);
      } catch {
        setBackendConnected(false);
      }
    }
    setTransactions((current) => current.filter((item) => item.id !== id));
  };

  return (
    <AppLayout>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Catat pengeluaran harian dengan kategori, metode, dan akun yang fleksibel.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Tambah Pengeluaran</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card-accent-red">
          <div className="stat-card-label">Total Pengeluaran</div>
          <div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(total)}</div>
          <div className="stat-card-sub">Dari {transactions.length} entri aktif</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Kategori Terbesar</div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>{largestCategory.name}</div>
          <div className="stat-card-sub">{fmt(largestCategory.value)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rata-rata</div>
          <div className="stat-card-value">{fmt(transactions.length ? Math.round(total / transactions.length) : 0)}</div>
          <div className="stat-card-sub">Per transaksi</div>
        </div>
      </div>

      <div className="grid-2 section">
        <div>
          <div className="section-header">
            <span className="section-title">Tren Pengeluaran</span>
            <div className="filter-bar">
              {FILTERS.map((item) => (
                <button key={item} className={`filter-btn${filter === item ? ' active' : ''}`} onClick={() => setFilter(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} formatter={(value) => fmt(value)} />
                  <Area type="monotone" dataKey="expense" stroke="var(--red)" fill="url(#ge)" strokeWidth={2} name="Pengeluaran" />
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
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {categoryBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} formatter={(value) => fmt(value)} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: 'var(--chart-tick)', fontSize: 11 }}>{value}</span>} />
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
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.description}</td>
                    <td><Badge color="red">{item.category}</Badge></td>
                    <td><Badge color="muted">{item.method}</Badge></td>
                    <td>{item.source}</td>
                    <td className="amount-red">{fmt(item.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditModal(item)} aria-label="Edit pengeluaran"><Edit2 size={11} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteTransaction(item.id)} aria-label="Hapus pengeluaran"><Trash2 size={11} /></button>
                        <button className="btn btn-secondary btn-icon btn-sm" title="Split Bill"><Split size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          title={editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
          onClose={closeModal}
          footer={(
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
              <button className="btn btn-primary" type="submit" form="expense-form">Simpan</button>
            </>
          )}
        >
          <form id="expense-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <input className="form-input" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Contoh: Makan siang" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Jumlah (IDR)</label>
                <input className="form-input" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} type="number" min="0" placeholder="0" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input className="form-input" value={form.date} onChange={(event) => updateForm('date', event.target.value)} type="date" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-input" value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {categoryOptions.map((item) => <option key={item}>{item}</option>)}
                  {!categoryOptions.includes('Other') && <option>Other</option>}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metode Bayar</label>
                <select className="form-input" value={form.method} onChange={(event) => updateForm('method', event.target.value)}>
                  {methodOptions.map((item) => <option key={item}>{item}</option>)}
                  {!methodOptions.includes('Other') && <option>Other</option>}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Akun Sumber</label>
              <select className="form-input" value={form.source} onChange={(event) => updateForm('source', event.target.value)}>
                {sourceOptions.map((item) => <option key={item}>{item}</option>)}
                {!sourceOptions.includes('Other') && <option>Other</option>}
              </select>
            </div>
            {(form.category === 'Other' || form.method === 'Other' || form.source === 'Other') && (
              <div className="form-row">
                {form.category === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Kategori Custom</label>
                    <input className="form-input" value={form.customCategory} onChange={(event) => updateForm('customCategory', event.target.value)} placeholder="Contoh: Groceries" />
                  </div>
                )}
                {form.method === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Metode Custom</label>
                    <input className="form-input" value={form.customMethod} onChange={(event) => updateForm('customMethod', event.target.value)} placeholder="Contoh: QRIS" />
                  </div>
                )}
                {form.source === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Akun Custom</label>
                    <input className="form-input" value={form.customSource} onChange={(event) => updateForm('customSource', event.target.value)} placeholder="Contoh: Jenius" />
                  </div>
                )}
              </div>
            )}
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
