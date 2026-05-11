import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { incomeTransactions, trendData, accounts, fmt } from '../data/mock';
import { INCOME_STORAGE_KEY, readList, todayInputValue, toRupiahNumber, uniqueByField, writeList } from '../lib/localFinance';
import { deleteTransaction as deleteBackendTransaction, loadFromBackend, loadTransactions, saveTransaction } from '../lib/backendFinance';

const FILTERS = ['Day', 'Month', 'Year'];
const CATEGORY_OPTIONS = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Cashback', 'Other'];

function blankForm() {
  return {
    description: '',
    amount: '',
    date: todayInputValue(),
    category: 'Salary',
    customCategory: '',
    source: accounts[0]?.name || '',
    customSource: '',
  };
}

export default function Income() {
  const [transactions, setTransactions] = useState(() => readList(INCOME_STORAGE_KEY, incomeTransactions));
  const [filter, setFilter] = useState('Month');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    let active = true;
    loadFromBackend(() => loadTransactions('INCOME'), readList(INCOME_STORAGE_KEY, incomeTransactions)).then(({ data, connected }) => {
      if (!active) return;
      setBackendConnected(connected);
      setTransactions(data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    writeList(INCOME_STORAGE_KEY, transactions);
  }, [transactions]);

  const totalIncome = useMemo(() => transactions.reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const averageIncome = transactions.length ? Math.round(totalIncome / transactions.length) : 0;
  const categoryOptions = useMemo(() => uniqueByField(transactions, 'category', CATEGORY_OPTIONS), [transactions]);
  const sourceOptions = useMemo(() => uniqueByField(transactions, 'source', accounts.map((account) => account.name)), [transactions]);

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
      source: form.source === 'Other' && form.customSource.trim() ? form.customSource.trim() : form.source,
    };

    if (backendConnected) {
      try {
        const saved = await saveTransaction('INCOME', nextTransaction);
        upsertTransaction(saved);
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
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">Semua sumber pemasukan kamu, termasuk kategori dan akun custom.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Tambah Income</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card-accent-green">
          <div className="stat-card-label">Total Pemasukan</div>
          <div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(totalIncome)}</div>
          <div className="stat-card-sub">Dari {transactions.length} entri aktif</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Transaksi</div>
          <div className="stat-card-value">{transactions.length}</div>
          <div className="stat-card-sub">Bisa tambah dan edit langsung</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rata-rata</div>
          <div className="stat-card-value">{fmt(averageIncome)}</div>
          <div className="stat-card-sub">Per transaksi</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-title">Tren Pemasukan</span>
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
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} formatter={(value) => fmt(value)} />
                <Area type="monotone" dataKey="income" stroke="var(--green)" fill="url(#gi)" strokeWidth={2} name="Pemasukan" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.description}</td>
                    <td><Badge color="green">{item.category}</Badge></td>
                    <td>{item.source}</td>
                    <td className="amount-green">{fmt(item.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditModal(item)} aria-label="Edit income"><Edit2 size={12} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteTransaction(item.id)} aria-label="Hapus income"><Trash2 size={12} /></button>
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
          title={editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
          onClose={closeModal}
          footer={(
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
              <button className="btn btn-primary" type="submit" form="income-form">Simpan</button>
            </>
          )}
        >
          <form id="income-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <input className="form-input" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Contoh: Gaji bulanan" required />
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
                <label className="form-label">Sumber Akun</label>
                <select className="form-input" value={form.source} onChange={(event) => updateForm('source', event.target.value)}>
                  {sourceOptions.map((item) => <option key={item}>{item}</option>)}
                  {!sourceOptions.includes('Other') && <option>Other</option>}
                </select>
              </div>
            </div>
            {(form.category === 'Other' || form.source === 'Other') && (
              <div className="form-row">
                {form.category === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Kategori Custom</label>
                    <input className="form-input" value={form.customCategory} onChange={(event) => updateForm('customCategory', event.target.value)} placeholder="Contoh: Royalti" />
                  </div>
                )}
                {form.source === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">Sumber Custom</label>
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
