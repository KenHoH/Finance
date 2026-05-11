import { useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle, Upload, Eye, Trash2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { friends as mockFriends, splitBills as mockSplitBills, fmt } from '../data/mock';
import { FRIEND_STORAGE_KEY, SPLIT_BILL_STORAGE_KEY, nextId, readList, splitStatus, todayInputValue, toRupiahNumber, writeList } from '../lib/localFinance';

const TABS = ['Semua', 'I Owe Them', 'They Owe Me'];

function statusColor(status) {
  if (status === 'SETTLED') return 'green';
  if (status === 'PARTIALLY_PAID') return 'yellow';
  return 'red';
}

function blankForm() {
  return {
    description: '',
    total: '',
    date: todayInputValue(),
    participants: [],
  };
}

export default function SplitBill() {
  const [items, setItems] = useState(() => readList(SPLIT_BILL_STORAGE_KEY, mockSplitBills));
  const [friends] = useState(() => readList(FRIEND_STORAGE_KEY, mockFriends));
  const [tab, setTab] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    writeList(SPLIT_BILL_STORAGE_KEY, items);
  }, [items]);

  const splits = items.map((split) => ({ ...split, status: splitStatus(split.participants) }));
  const filtered = useMemo(() => {
    if (tab === 'I Owe Them') {
      return splits.filter((split) => split.creator !== 'Me' && split.participants.some((participant) => participant.name === 'Me' && !participant.paid));
    }
    if (tab === 'They Owe Me') {
      return splits.filter((split) => split.creator === 'Me' && split.participants.some((participant) => participant.name !== 'Me' && !participant.paid));
    }
    return splits;
  }, [splits, tab]);

  const iOweTotal = splits.reduce((sum, split) => {
    const me = split.participants.find((participant) => participant.name === 'Me');
    return sum + (split.creator !== 'Me' && me && !me.paid ? me.amount : 0);
  }, 0);
  const theyOweTotal = splits.reduce((sum, split) => {
    if (split.creator !== 'Me') return sum;
    return sum + split.participants.filter((participant) => participant.name !== 'Me' && !participant.paid).reduce((partSum, participant) => partSum + participant.amount, 0);
  }, 0);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleParticipant = (name) => {
    setForm((current) => {
      const exists = current.participants.includes(name);
      return {
        ...current,
        participants: exists ? current.participants.filter((item) => item !== name) : [...current.participants, name],
      };
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(blankForm());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const description = form.description.trim();
    const total = toRupiahNumber(form.total);
    if (!description || !total || !form.date || form.participants.length === 0) return;
    const names = ['Me', ...form.participants];
    const amount = Math.round(total / names.length);
    const participants = names.map((name) => ({ name, amount, paid: name === 'Me' }));
    const split = {
      id: nextId(),
      description,
      date: form.date,
      total,
      status: splitStatus(participants),
      creator: 'Me',
      participants,
    };
    setItems((current) => [split, ...current]);
    closeModal();
  };

  const markPaid = (splitId, participantName) => {
    setItems((current) => current.map((split) => {
      if (split.id !== splitId) return split;
      const participants = split.participants.map((participant) => (
        participant.name === participantName ? { ...participant, paid: true } : participant
      ));
      return { ...split, participants, status: splitStatus(participants) };
    }));
  };

  const deleteSplit = (id) => {
    setItems((current) => current.filter((split) => split.id !== id));
  };

  return (
    <AppLayout>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Split Bill</h1>
          <p className="page-subtitle">Peserta split ambil dari Friends, dibagi rata, dan status bisa berubah jadi lunas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Buat Split</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-card-label">Saya Hutang</div><div className="stat-card-value" style={{ color: 'var(--red)' }}>{fmt(iOweTotal)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Saya Ditagih</div><div className="stat-card-value" style={{ color: 'var(--green)' }}>{fmt(theyOweTotal)}</div></div>
        <div className="stat-card"><div className="stat-card-label">Net Balance</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{fmt(theyOweTotal - iOweTotal)}</div></div>
      </div>

      <div className="tabs">
        {TABS.map((item) => <button key={item} className={`tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map((split) => (
          <div key={split.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{split.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{split.date}</span>
                  <Badge color="muted">by {split.creator}</Badge>
                  <Badge color={statusColor(split.status)}>{split.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(split.total)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {split.participants.map((participant) => (
                <div key={participant.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, flexWrap: 'wrap' }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{participant.name.slice(0, 2).toUpperCase()}</div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{participant.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(participant.amount)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: participant.paid ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {participant.paid ? <CheckCircle size={12} /> : 'Pending'} {participant.paid ? 'Lunas' : ''}
                  </span>
                  {!participant.paid && participant.name !== 'Me' && <button className="btn btn-success btn-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => markPaid(split.id, participant.name)}>Mark Paid</button>}
                  <button className="btn btn-secondary btn-icon btn-sm" style={{ padding: '3px 6px' }}><Upload size={10} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary btn-sm"><Eye size={12} /> Detail</button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteSplit(split.id)} aria-label="Hapus split"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          title="Buat Split Bill"
          onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Batal</button><button className="btn btn-primary" type="submit" form="split-form">Buat Split</button></>}
        >
          <form id="split-form" onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Deskripsi</label><input className="form-input" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Contoh: Dinner di Resto" required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Total (IDR)</label><input className="form-input" value={form.total} onChange={(event) => updateForm('total', event.target.value)} type="number" min="0" placeholder="0" required /></div>
              <div className="form-group"><label className="form-label">Tanggal</label><input className="form-input" value={form.date} onChange={(event) => updateForm('date', event.target.value)} type="date" required /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Peserta</label>
              <div className="choice-grid">
                {friends.map((friend) => (
                  <button key={friend.id} type="button" className={`choice-pill${form.participants.includes(friend.name) ? ' active' : ''}`} onClick={() => toggleParticipant(friend.name)}>
                    {friend.name}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
