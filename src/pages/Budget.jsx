import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, AlertTriangle, Trash2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { budgets as mockBudgets, expenseTransactions, fmt } from '../data/mock';
import {
  BUDGET_STORAGE_KEY,
  EXPENSE_STORAGE_KEY,
  hydrateBudgets,
  monthLabel,
  nextId,
  readList,
  todayInputValue,
  toRupiahNumber,
  writeList,
} from '../lib/localFinance';
import { deleteBudget as deleteBackendBudget, loadBudgets, loadFromBackend, saveBudget } from '../lib/backendFinance';

const CATEGORY_OPTIONS = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Education'];
const ICONS = {
  Food: 'FD',
  Transport: 'TR',
  Entertainment: 'EN',
  Utilities: 'UT',
  Health: 'HE',
  Education: 'ED',
};

function blankForm() {
  const today = todayInputValue();
  return {
    category: 'Food',
    customCategory: '',
    budget: '',
    threshold: '80',
    start: today,
    end: today.slice(0, 8) + '31',
  };
}

export default function Budget() {
  const [items, setItems] = useState(() => readList(BUDGET_STORAGE_KEY, mockBudgets));
  const [expenses] = useState(() => readList(EXPENSE_STORAGE_KEY, expenseTransactions));
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    let active = true;
    loadFromBackend(() => loadBudgets(), readList(BUDGET_STORAGE_KEY, mockBudgets)).then(({ data, connected }) => {
      if (!active) return;
      setBackendConnected(connected);
      setItems(data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    writeList(BUDGET_STORAGE_KEY, items);
  }, [items]);

  const budgets = useMemo(() => hydrateBudgets(items, expenses), [items, expenses]);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budget, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const categoryOptions = useMemo(() => {
    const categories = [...CATEGORY_OPTIONS, ...items.map((item) => item.category)].filter(Boolean);
    return categories.filter((item, index) => categories.indexOf(item) === index);
  }, [items]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEditModal = (budget) => {
    setEditingId(budget.id);
    setForm({
      category: categoryOptions.includes(budget.category) ? budget.category : 'Other',
      customCategory: categoryOptions.includes(budget.category) ? '' : budget.category,
      budget: budget.budget,
      threshold: budget.threshold || 80,
      start: budget.start || todayInputValue(),
      end: budget.end || todayInputValue(),
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

  const upsertBudget = (nextBudget) => {
    setItems((current) => (editingId
      ? current.map((item) => (item.id === editingId ? nextBudget : item))
      : [nextBudget, ...current]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = toRupiahNumber(form.budget);
    const category = form.category === 'Other' && form.customCategory.trim() ? form.customCategory.trim() : form.category;
    if (!category || !amount || !form.start || !form.end) return;

    const nextBudget = {
      id: editingId || nextId(),
      category,
      icon: ICONS[category] || category.slice(0, 2).toUpperCase(),
      budget: amount,
      spent: 0,
      period: monthLabel(form.start),
      start: form.start,
      end: form.end,
      threshold: Math.min(100, Math.max(1, toRupiahNumber(form.threshold) || 80)),
    };

    if (backendConnected) {
      try {
        upsertBudget(await saveBudget(nextBudget));
      } catch {
        setBackendConnected(false);
        upsertBudget(nextBudget);
      }
    } else {
      upsertBudget(nextBudget);
    }
    closeModal();
  };

  const deleteBudget = async (id) => {
    if (backendConnected && String(id).includes('-')) {
      try {
        await deleteBackendBudget(id);
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
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Budget card otomatis ngikut kategori pengeluaran yang kamu input.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Buat Budget</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-card-label">Total Budget</div><div className="stat-card-value">{fmt(totalBudget)}</div><div className="stat-card-sub">Dari {budgets.length} kategori</div></div>
        <div className="stat-card"><div className="stat-card-label">Total Dipakai</div><div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(totalSpent)}</div><div className="stat-card-sub">{totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}% dari budget</div></div>
        <div className="stat-card"><div className="stat-card-label">Sisa Budget</div><div className="stat-card-value" style={{ color: totalRemaining < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(totalRemaining)}</div></div>
      </div>

      <div className="grid-auto">
        {budgets.map((budget) => {
          const pct = budget.budget ? Math.round((budget.spent / budget.budget) * 100) : 0;
          const over = pct >= 100;
          const warn = pct >= budget.threshold;
          return (
            <div key={budget.id} className="card" style={{ borderColor: over ? 'var(--red)' : warn ? 'var(--yellow)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mini-token">{budget.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{budget.category}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{budget.period}</div>
                  </div>
                </div>
                {over ? <Badge color="red">Over Budget</Badge> : warn ? <Badge color="yellow">Hampir Limit</Badge> : <Badge color="green">Aman</Badge>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Dipakai: <strong style={{ color: 'var(--text-primary)' }}>{fmt(budget.spent)}</strong></span>
                <span><strong style={{ color: 'var(--accent)' }}>{pct}%</strong></span>
              </div>
              <ProgressBar percent={pct} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Sisa: {fmt(budget.budget - budget.spent)}</span>
                <span>Budget: {fmt(budget.budget)}</span>
              </div>
              {warn && !over && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--yellow)', background: 'var(--yellow-soft)', padding: '6px 10px', borderRadius: 6 }}>
                  <AlertTriangle size={12} /> Alert threshold {budget.threshold}% tercapai
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditModal(budget)}><Edit2 size={12} /> Edit</button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteBudget(budget.id)} aria-label="Hapus budget"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal
          title={editingId ? 'Edit Budget' : 'Buat Budget Baru'}
          onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Batal</button><button className="btn btn-primary" type="submit" form="budget-form">Simpan</button></>}
        >
          <form id="budget-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-input" value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                {categoryOptions.map((item) => <option key={item}>{item}</option>)}
                {!categoryOptions.includes('Other') && <option>Other</option>}
              </select>
            </div>
            {form.category === 'Other' && (
              <div className="form-group">
                <label className="form-label">Kategori Custom</label>
                <input className="form-input" value={form.customCategory} onChange={(event) => updateForm('customCategory', event.target.value)} placeholder="Contoh: Groceries" />
              </div>
            )}
            <div className="form-row">
              <div className="form-group"><label className="form-label">Budget (IDR)</label><input className="form-input" value={form.budget} onChange={(event) => updateForm('budget', event.target.value)} type="number" min="0" placeholder="0" required /></div>
              <div className="form-group"><label className="form-label">Alert Threshold (%)</label><input className="form-input" value={form.threshold} onChange={(event) => updateForm('threshold', event.target.value)} type="number" min="1" max="100" placeholder="80" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Mulai</label><input className="form-input" value={form.start} onChange={(event) => updateForm('start', event.target.value)} type="date" required /></div>
              <div className="form-group"><label className="form-label">Selesai</label><input className="form-input" value={form.end} onChange={(event) => updateForm('end', event.target.value)} type="date" required /></div>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
