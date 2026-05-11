import { useEffect, useState } from 'react';
import { Plus, Edit2, Pause, Play, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { savings as mockSavings, fmt } from '../data/mock';
import { SAVING_STORAGE_KEY, nextId, readList, toRupiahNumber, writeList } from '../lib/localFinance';

function blankForm() {
  return {
    name: '',
    target: '',
    current: '',
    autoDeposit: 'Tidak',
    amount: '',
  };
}

export default function Saving() {
  const [items, setItems] = useState(() => readList(SAVING_STORAGE_KEY, mockSavings));
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const totalSaved = items.reduce((sum, saving) => sum + saving.current, 0);
  const totalTarget = items.reduce((sum, saving) => sum + saving.target, 0);
  const monthlyRate = items.filter((saving) => saving.autoDeposit).reduce((sum, saving) => sum + (saving.amount || 0), 0);

  useEffect(() => {
    writeList(SAVING_STORAGE_KEY, items);
  }, [items]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEditModal = (saving) => {
    setEditingId(saving.id);
    setForm({
      name: saving.name,
      target: saving.target,
      current: saving.current,
      autoDeposit: saving.autoDeposit ? saving.frequency || 'Monthly' : 'Tidak',
      amount: saving.amount || '',
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const target = toRupiahNumber(form.target);
    if (!name || !target) return;

    const nextSaving = {
      id: editingId || nextId(),
      name,
      target,
      current: Math.min(target, toRupiahNumber(form.current)),
      autoDeposit: form.autoDeposit !== 'Tidak',
      frequency: form.autoDeposit === 'Tidak' ? null : form.autoDeposit,
      amount: form.autoDeposit === 'Tidak' ? null : toRupiahNumber(form.amount),
    };

    setItems((current) => (editingId
      ? current.map((item) => (item.id === editingId ? nextSaving : item))
      : [nextSaving, ...current]));
    closeModal();
  };

  const changeBalance = (saving, direction) => {
    const label = direction > 0 ? 'Deposit' : 'Tarik';
    const value = window.prompt(`${label} untuk ${saving.name}`, '100000');
    const amount = toRupiahNumber(value);
    if (!amount) return;
    setItems((current) => current.map((item) => {
      if (item.id !== saving.id) return item;
      const nextCurrent = Math.min(item.target, Math.max(0, item.current + amount * direction));
      return { ...item, current: nextCurrent };
    }));
  };

  const toggleAutoDeposit = (saving) => {
    setItems((current) => current.map((item) => (
      item.id === saving.id
        ? { ...item, autoDeposit: !item.autoDeposit, frequency: item.frequency || 'Monthly', amount: item.amount || 0 }
        : item
    )));
  };

  const deleteSaving = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <AppLayout>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Saving</h1>
          <p className="page-subtitle">Tabungan bisa dibuat, diedit, deposit, tarik, dan auto-deposit bisa di-toggle.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Buat Tabungan</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-card-label">Total Tabungan</div><div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(totalSaved)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Total Target</div><div className="stat-card-value">{fmt(totalTarget)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Auto-Deposit / Bulan</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{fmt(monthlyRate)}</div></div>
      </div>

      <div className="grid-auto">
        {items.map((saving) => {
          const pct = saving.target ? Math.round((saving.current / saving.target) * 100) : 0;
          return (
            <div key={saving.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{saving.name}</div>
                <Badge color={saving.autoDeposit ? 'green' : 'muted'}>{saving.autoDeposit ? 'Auto On' : 'Manual'}</Badge>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{fmt(saving.current)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Target: {fmt(saving.target)}</div>
              <ProgressBar percent={pct} color="green" />
              <div style={{ textAlign: 'right', fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>{pct}%</div>
              {saving.autoDeposit && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, background: 'var(--green-soft)', padding: '6px 10px', borderRadius: 6 }}>
                  Auto {saving.frequency}: {fmt(saving.amount || 0)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => changeBalance(saving, 1)}><ArrowDownCircle size={12} /> Deposit</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => changeBalance(saving, -1)}><ArrowUpCircle size={12} /> Tarik</button>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditModal(saving)} aria-label="Edit tabungan"><Edit2 size={12} /></button>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => toggleAutoDeposit(saving)} aria-label="Toggle auto-deposit">{saving.autoDeposit ? <Pause size={12} /> : <Play size={12} />}</button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteSaving(saving.id)} aria-label="Hapus tabungan"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal
          title={editingId ? 'Edit Tabungan' : 'Buat Tabungan Baru'}
          onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Batal</button><button className="btn btn-primary" type="submit" form="saving-form">Simpan</button></>}
        >
          <form id="saving-form" onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Nama Tabungan</label><input className="form-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Contoh: Tabungan Lebaran" required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Target (IDR)</label><input className="form-input" value={form.target} onChange={(event) => updateForm('target', event.target.value)} type="number" min="0" placeholder="0" required /></div>
              <div className="form-group"><label className="form-label">Saldo Saat Ini</label><input className="form-input" value={form.current} onChange={(event) => updateForm('current', event.target.value)} type="number" min="0" placeholder="0" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Auto-Deposit</label><select className="form-input" value={form.autoDeposit} onChange={(event) => updateForm('autoDeposit', event.target.value)}><option>Tidak</option><option>Weekly</option><option>Monthly</option></select></div>
              <div className="form-group"><label className="form-label">Jumlah Auto-Deposit</label><input className="form-input" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} type="number" min="0" placeholder="0" /></div>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
