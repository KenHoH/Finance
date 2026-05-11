import { useEffect, useMemo, useState } from 'react';
import { Plus, UserMinus, Split, Bell, Eye } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { friends as mockFriends, splitBills, fmt } from '../data/mock';
import { FRIEND_STORAGE_KEY, SPLIT_BILL_STORAGE_KEY, initials, nextId, readList, todayInputValue, writeList } from '../lib/localFinance';

function blankForm() {
  return {
    name: '',
    email: '',
    bank: '',
  };
}

export default function Friends() {
  const [friends, setFriends] = useState(() => readList(FRIEND_STORAGE_KEY, mockFriends));
  const [splits] = useState(() => readList(SPLIT_BILL_STORAGE_KEY, splitBills));
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    writeList(FRIEND_STORAGE_KEY, friends);
  }, [friends]);

  const hydratedFriends = useMemo(() => friends.map((friend) => {
    const relatedSplits = splits.filter((split) => split.participants.some((participant) => participant.name === friend.name && !participant.paid));
    const iOwe = relatedSplits
      .filter((split) => split.creator === friend.name)
      .reduce((sum, split) => sum + (split.participants.find((participant) => participant.name === 'Me' && !participant.paid)?.amount || 0), 0);
    const theyOwe = relatedSplits
      .filter((split) => split.creator === 'Me')
      .reduce((sum, split) => sum + (split.participants.find((participant) => participant.name === friend.name && !participant.paid)?.amount || 0), 0);
    return { ...friend, activeSplits: relatedSplits.length, iOwe, theyOwe };
  }), [friends, splits]);

  const filtered = hydratedFriends.filter((friend) => friend.name.toLowerCase().includes(search.toLowerCase()) || friend.email.toLowerCase().includes(search.toLowerCase()));

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(blankForm());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || !email) return;
    setFriends((current) => [{
      id: nextId(),
      name,
      email,
      avatar: initials(name),
      activeSplits: 0,
      iOwe: 0,
      theyOwe: 0,
      since: todayInputValue(),
      bank: form.bank.trim(),
    }, ...current]);
    closeModal();
  };

  const deleteFriend = (id) => {
    setFriends((current) => current.filter((friend) => friend.id !== id));
  };

  return (
    <AppLayout>
      <div className="page-header page-header-row">
        <div>
          <h1 className="page-title">Friends</h1>
          <p className="page-subtitle">Teman baru langsung bisa dipakai sebagai peserta Split Bill.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Tambah Teman</button>
      </div>

      <div className="stat-cards" style={{ maxWidth: 560 }}>
        <div className="stat-card"><div className="stat-card-label">Total Teman</div><div className="stat-card-value">{friends.length}</div></div>
        <div className="stat-card"><div className="stat-card-label">Split Aktif</div><div className="stat-card-value" style={{ color: 'var(--accent)' }}>{hydratedFriends.reduce((sum, friend) => sum + friend.activeSplits, 0)}</div></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="Cari nama atau email..." value={search} onChange={(event) => setSearch(event.target.value)} style={{ maxWidth: 360 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((friend) => (
          <div key={friend.id} className="card responsive-row">
            <div className="avatar" style={{ width: 44, height: 44, fontSize: 15 }}>{friend.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{friend.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{friend.email}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge color="muted">{friend.activeSplits} split aktif</Badge>
                {friend.iOwe > 0 && <Badge color="red">Hutang {fmt(friend.iOwe)}</Badge>}
                {friend.theyOwe > 0 && <Badge color="green">Ditagih {fmt(friend.theyOwe)}</Badge>}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginRight: 8 }}>
              <div>Berteman sejak</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{friend.since}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm"><Eye size={12} /></button>
              <button className="btn btn-secondary btn-sm"><Split size={12} /> Split</button>
              <button className="btn btn-secondary btn-sm"><Bell size={12} /></button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteFriend(friend.id)} aria-label="Hapus teman"><UserMinus size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          title="Tambah Teman"
          onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Batal</button><button className="btn btn-primary" type="submit" form="friend-form">Tambah</button></>}
        >
          <form id="friend-form" onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Contoh: Budi Santoso" required /></div>
            <div className="form-group"><label className="form-label">Email / Username</label><input className="form-input" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="email@gmail.com atau @username" required /></div>
            <div className="form-group"><label className="form-label">Bank / Rekening</label><input className="form-input" value={form.bank} onChange={(event) => updateForm('bank', event.target.value)} placeholder="Opsional" /></div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
