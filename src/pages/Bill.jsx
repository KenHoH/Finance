import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, SkipForward } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { bills as mockBills, fmt } from '../data/mock';
import { BILL_STORAGE_KEY, nextId, readList, todayInputValue, toRupiahNumber, writeList } from '../lib/localFinance';
import { deleteBill as deleteBackendBill, loadBills, loadFromBackend, payBackendBill, saveBill } from '../lib/backendFinance';

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

function normalizeStatus(date, status) {
  if (status === 'paid') return 'paid';
  const today = todayInputValue();
  if (date < today) return 'overdue';
  const gap = Math.ceil((new Date(`${date}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000);
  return gap <= 5 ? 'due_soon' : 'upcoming';
}

function blankForm() {
  return {
    name: '',
    amount: '',
    frequency: 'Monthly',
    nextDue: todayInputValue(),
    category: 'Entertainment',
  };
}

export default function Bill() {
  const [items, setItems] = useState(() => readList(BILL_STORAGE_KEY, mockBills));
  const [tab, setTab] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [backendConnected, setBackendConnected] = useState(false);
  const bills = items.map((bill) => ({ ...bill, status: normalizeStatus(bill.nextDue, bill.status) }));

  useEffect(() => {
    let active = true;
    loadFromBackend(() => loadBills(), readList(BILL_STORAGE_KEY, mockBills)).then(({ data, connected }) => {
      if (!active) return;
      setBackendConnected(connected);
      setItems(data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    writeList(BILL_STORAGE_KEY, items);
  }, [items]);

  const totalMonth = bills.filter((bill) => bill.status !== 'paid').reduce((sum, bill) => sum + bill.amount, 0);
  const upcoming = bills.filter((bill) => bill.status === 'upcoming').length;
  const overdue = bills.filter((bill) => bill.status === 'overdue').length;
  const filtered = tab === 'Semua' ? bills
    : tab === 'Upcoming' ? bills.filter((bill) => bill.status === 'upcoming')
    : tab === 'Due Soon' ? bills.filter((bill) => bill.status === 'due_soon')
    : tab === 'Overdue' ? bills.filter((bill) => bill.status === 'overdue')
    : bills.filter((bill) => bill.status === 'paid');

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEditModal = (bill) => {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      amount: bill.amount,
      frequency: bill.frequency,
      nextDue: bill.nextDue,
      category: bill.category,
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

  const upsertBill = (nextBill) => {
    setItems((current) => (editingId
      ? current.map((item) => (item.id === editingId ? nextBill : item))
      : [nextBill, ...current]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const amount = toRupiahNumber(form.amount);
    if (!name || !amount || !form.nextDue) return;

    const nextBill = {
      id: editingId || nextId(),
      name,
      amount,
      frequency: form.frequency,
      nextDue: form.nextDue,
      status: normalizeStatus(form.nextDue, 'upcoming'),
      category: form.category,
      icon: form.category.slice(0, 2).toUpperCase(),
    };

    if (backendConnected) {
      try {
        upsertBill(await saveBill(nextBill));
      } catch {
        setBackendConnected(false);
        upsertBill(nextBill);
      }
    } else {
      upsertBill(nextBill);
    }
    closeModal();
  };

  const payBill = async (bill) => {
    if (backendConnected && String(bill.id).includes('-')) {
      try {
        const status = await payBackendBill(bill.id);
        setItems((current) => current.map((item) => (item.id === bill.id ? { ...item, status } : item)));
        return;
      } catch {
        setBackendConnected(false);
      }
    }
    setItems((current) => current.map((item) => (item.id === bill.id ? { ...item, status: 'paid' } : item)));
  };

  const skipBill = (bill) => {
    const currentDate = new Date(`${bill.nextDue}T00:00:00`);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const nextDue = currentDate.toISOString().slice(0, 10);
    setItems((current) => current.map((item) => (item.id === bill.id ? { ...item, nextDue, status: normalizeStatus(nextDue, 'upcoming') } : item)));
  };

  const deleteBill = async (id) => {
    if (backendConnected && String(id).includes('-')) {
      try {
        await deleteBackendBill(id);
      } catch {
        setBackendConnected(false);
      }
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <AppLayout>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Bills</h1>
          <p className="page-subtitle">Tagihan bisa ditambah, dibayar, skip bulan depan, edit, dan hapus.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Tambah Tagihan</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-card-label">Total Bulan Ini</div><div className="stat-card-value">{fmt(totalMonth)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Upcoming</div><div className="stat-card-value" style={{ color: 'var(--blue)' }}>{upcoming}</div></div>
        <div className="stat-card"><div className="stat-card-label">Overdue</div><div className="stat-card-value" style={{ color: 'var(--red)' }}>{overdue}</div></div>
      </div>

      <div className="tabs">
        {TAB_LABELS.map((item) => <button key={item} className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((bill) => (
          <div key={bill.id} className="card responsive-row">
            <div className="mini-token">{bill.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{bill.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge color="muted">{bill.frequency}</Badge>
                <Badge color="accent">{bill.category}</Badge>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jatuh tempo: {bill.nextDue}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(bill.amount)}</div>
              <Badge color={getBillColor(bill.status)}>{getBillLabel(bill.status)}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {bill.status !== 'paid' && <button className="btn btn-success btn-sm" onClick={() => payBill(bill)}><CheckCircle size={12} /> Bayar</button>}
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => skipBill(bill)} aria-label="Skip tagihan"><SkipForward size={12} /></button>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditModal(bill)} aria-label="Edit tagihan"><Edit2 size={12} /></button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteBill(bill.id)} aria-label="Hapus tagihan"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          title={editingId ? 'Edit Tagihan' : 'Tambah Tagihan'}
          onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Batal</button><button className="btn btn-primary" type="submit" form="bill-form">Simpan</button></>}
        >
          <form id="bill-form" onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Nama Tagihan</label><input className="form-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Contoh: Netflix" required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Jumlah (IDR)</label><input className="form-input" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} type="number" min="0" placeholder="0" required /></div>
              <div className="form-group"><label className="form-label">Frekuensi</label><select className="form-input" value={form.frequency} onChange={(event) => updateForm('frequency', event.target.value)}><option>Monthly</option><option>Weekly</option><option>Yearly</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Tanggal Mulai</label><input className="form-input" value={form.nextDue} onChange={(event) => updateForm('nextDue', event.target.value)} type="date" required /></div>
              <div className="form-group"><label className="form-label">Kategori</label><select className="form-input" value={form.category} onChange={(event) => updateForm('category', event.target.value)}><option>Entertainment</option><option>Utilities</option><option>Health</option><option>Transport</option><option>Education</option></select></div>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
