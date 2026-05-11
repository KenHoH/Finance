import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import { goals as mockGoals, fmt } from '../data/mock';
import { GOAL_STORAGE_KEY, nextId, readList, todayInputValue, toRupiahNumber, writeList } from '../lib/localFinance';
import { contributeGoal, deleteGoal as deleteBackendGoal, loadFromBackend, loadGoals, saveGoal } from '../lib/backendFinance';

const statusColor = { active: 'blue', completed: 'green', expired: 'red' };

function normalizeGoal(goal) {
  const pct = goal.target ? Math.round((goal.current / goal.target) * 100) : 0;
  const expired = goal.deadline && goal.deadline < todayInputValue() && pct < 100;
  return {
    ...goal,
    status: pct >= 100 ? 'completed' : expired ? 'expired' : 'active',
  };
}

function blankForm() {
  return {
    name: '',
    description: '',
    target: '',
    current: '',
    deadline: todayInputValue(),
    icon: 'GO',
  };
}

export default function Goals() {
  const [items, setItems] = useState(() => readList(GOAL_STORAGE_KEY, mockGoals));
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [backendConnected, setBackendConnected] = useState(false);
  const goals = items.map(normalizeGoal);
  const active = goals.filter((goal) => goal.status === 'active').length;
  const completed = goals.filter((goal) => goal.status === 'completed').length;

  useEffect(() => {
    let activeRequest = true;
    loadFromBackend(() => loadGoals(), readList(GOAL_STORAGE_KEY, mockGoals)).then(({ data, connected }) => {
      if (!activeRequest) return;
      setBackendConnected(connected);
      setItems(data);
    });
    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    writeList(GOAL_STORAGE_KEY, items);
  }, [items]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEditModal = (goal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      description: goal.description || '',
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline || todayInputValue(),
      icon: goal.icon || 'GO',
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

  const upsertGoal = (nextGoal) => {
    setItems((current) => (editingId
      ? current.map((item) => (item.id === editingId ? nextGoal : item))
      : [nextGoal, ...current]));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const target = toRupiahNumber(form.target);
    if (!name || !target) return;

    const nextGoal = normalizeGoal({
      id: editingId || nextId(),
      name,
      target,
      current: Math.min(target, toRupiahNumber(form.current)),
      deadline: form.deadline,
      description: form.description.trim(),
      icon: form.icon.trim().slice(0, 2).toUpperCase() || 'GO',
    });

    if (backendConnected) {
      try {
        upsertGoal(normalizeGoal(await saveGoal(nextGoal)));
      } catch {
        setBackendConnected(false);
        upsertGoal(nextGoal);
      }
    } else {
      upsertGoal(nextGoal);
    }
    closeModal();
  };

  const addFunds = async (goal) => {
    const value = window.prompt(`Tambah dana untuk ${goal.name}`, '100000');
    const amount = toRupiahNumber(value);
    if (!amount) return;
    if (backendConnected && String(goal.id).includes('-')) {
      try {
        const updated = normalizeGoal(await contributeGoal(goal.id, amount));
        setItems((current) => current.map((item) => (item.id === goal.id ? updated : item)));
        return;
      } catch {
        setBackendConnected(false);
      }
    }
    setItems((current) => current.map((item) => (
      item.id === goal.id ? normalizeGoal({ ...item, current: Math.min(item.target, item.current + amount) }) : item
    )));
  };

  const deleteGoal = async (id) => {
    if (backendConnected && String(id).includes('-')) {
      try {
        await deleteBackendGoal(id);
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
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Goal baru langsung muncul, progress bisa ditambah kapan aja.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Buat Goal</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-card-label">Total Goals</div><div className="stat-card-value">{goals.length}</div></div>
        <div className="stat-card"><div className="stat-card-label">Aktif</div><div className="stat-card-value" style={{ color: 'var(--blue)' }}>{active}</div></div>
        <div className="stat-card"><div className="stat-card-label">Selesai</div><div className="stat-card-value" style={{ color: 'var(--green)' }}>{completed}</div></div>
      </div>

      <div className="grid-auto">
        {goals.map((goal) => {
          const pct = goal.target ? Math.round((goal.current / goal.target) * 100) : 0;
          return (
            <div key={goal.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                  <span className="mini-token">{goal.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{goal.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{goal.description || 'Tanpa deskripsi'}</div>
                  </div>
                </div>
                <Badge color={statusColor[goal.status]}>{goal.status}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
              </div>
              <ProgressBar percent={pct} color="accent" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>{fmt(goal.current)}</span><span>{fmt(goal.target)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>Deadline: {goal.deadline}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => addFunds(goal)}><PlusCircle size={12} /> Tambah Dana</button>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditModal(goal)} aria-label="Edit goal"><Edit2 size={12} /></button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteGoal(goal.id)} aria-label="Hapus goal"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal
          title={editingId ? 'Edit Goal' : 'Buat Goal Baru'}
          onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Batal</button><button className="btn btn-primary" type="submit" form="goal-form">Simpan</button></>}
        >
          <form id="goal-form" onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Nama Goal</label><input className="form-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Contoh: Rumah Impian" required /></div>
            <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Opsional" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Target (IDR)</label><input className="form-input" value={form.target} onChange={(event) => updateForm('target', event.target.value)} type="number" min="0" placeholder="0" required /></div>
              <div className="form-group"><label className="form-label">Terkumpul Saat Ini</label><input className="form-input" value={form.current} onChange={(event) => updateForm('current', event.target.value)} type="number" min="0" placeholder="0" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" value={form.deadline} onChange={(event) => updateForm('deadline', event.target.value)} type="date" /></div>
              <div className="form-group"><label className="form-label">Label Ikon</label><input className="form-input" value={form.icon} onChange={(event) => updateForm('icon', event.target.value)} placeholder="GO" maxLength={2} /></div>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
