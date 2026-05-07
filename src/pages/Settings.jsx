import { useState } from 'react';
import { User, Lock, Bell, Sliders, Shield, Link2, Download } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { currentUser } from '../data/mock';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'account', label: 'Account', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'preferences', label: 'Preferences', icon: Sliders },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'connected', label: 'Connected Accounts', icon: Link2 },
];

function Toggle({ on }) {
  const [val, setVal] = useState(on);
  return (
    <button onClick={() => setVal(!val)} style={{
      width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
      background: val ? 'var(--accent)' : 'var(--border-light)',
      position: 'relative', transition: '0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: val ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        transition: '0.2s',
      }} />
    </button>
  );
}

function Row({ label, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [active, setActive] = useState('profile');

  const renderContent = () => {
    if (active === 'profile') return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--bg-input)', borderRadius: 12 }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{currentUser.avatar}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{currentUser.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{currentUser.username} · {currentUser.email}</div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Edit Avatar</button>
        </div>
        <div className="form-group"><label className="form-label">Nama Lengkap</label><input className="form-input" defaultValue={currentUser.name} /></div>
        <div className="form-group"><label className="form-label">Username</label><input className="form-input" defaultValue={currentUser.username} /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue={currentUser.email} disabled /></div>
        <button className="btn btn-primary">Simpan Perubahan</button>
      </div>
    );
    if (active === 'account') return (
      <div>
        <Row label="Ubah Password" sub="Terakhir diubah 3 bulan lalu"><button className="btn btn-secondary btn-sm">Ubah</button></Row>
        <Row label="Session Aktif" sub="2 perangkat"><button className="btn btn-secondary btn-sm">Kelola</button></Row>
        <Row label="Export Data" sub="Download semua transaksi">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm"><Download size={12} /> CSV</button>
            <button className="btn btn-secondary btn-sm"><Download size={12} /> PDF</button>
          </div>
        </Row>
        <Row label="Hapus Akun" sub="Aksi ini tidak bisa dibatalkan"><button className="btn btn-danger btn-sm">Hapus Akun</button></Row>
      </div>
    );
    if (active === 'notifications') return (
      <div>
        {[
          { label: 'Budget Alert', sub: 'Notifikasi saat mendekati/melebihi budget' },
          { label: 'Goal Progress', sub: 'Update progress goal kamu' },
          { label: 'Recurring Reminder', sub: 'Pengingat tagihan berulang' },
          { label: 'Split Bill', sub: 'Update status split bill' },
          { label: 'System', sub: 'Pembaruan dan info sistem' },
        ].map(n => <Row key={n.label} label={n.label} sub={n.sub}><Toggle on={true} /></Row>)}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Channel</div>
          {['Email', 'Push', 'In-app'].map(c => <Row key={c} label={c}><Toggle on={c !== 'Push'} /></Row>)}
        </div>
        <div style={{ marginTop: 20 }}>
          <div className="form-group"><label className="form-label">Quiet Hours</label>
            <div className="form-row">
              <input className="form-input" type="time" defaultValue="22:00" />
              <input className="form-input" type="time" defaultValue="07:00" />
            </div>
          </div>
        </div>
      </div>
    );
    if (active === 'preferences') return (
      <div>
        <div className="form-group"><label className="form-label">Mata Uang</label><select className="form-input"><option>IDR — Rupiah Indonesia</option><option>USD — US Dollar</option><option>SGD — Singapore Dollar</option></select></div>
        <div className="form-group"><label className="form-label">Bahasa</label><select className="form-input"><option>Bahasa Indonesia</option><option>English</option></select></div>
        <div className="form-group"><label className="form-label">Tema</label><select className="form-input"><option>Dark</option><option>Light</option><option>System</option></select></div>
        <div className="form-group"><label className="form-label">Format Tanggal</label><select className="form-input"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></div>
        <button className="btn btn-primary">Simpan Preferensi</button>
      </div>
    );
    if (active === 'privacy') return (
      <div>
        <Row label="Siapa yang bisa lihat rekening bank?" sub="Pengaturan visibilitas rekening">
          <select className="form-input" style={{ width: 'auto' }}><option>Hanya Teman</option><option>Tidak Ada</option></select>
        </Row>
        <Row label="Profil Publik" sub="Izinkan orang lain mencari akunmu"><Toggle on={true} /></Row>
      </div>
    );
    if (active === 'connected') return (
      <div>
        <Row label="Google OAuth" sub="Terhubung sebagai rizky@gmail.com"><button className="btn btn-danger btn-sm">Disconnect</button></Row>
        <Row label="Sinkronisasi Email" sub="Impor transaksi dari Gmail"><Toggle on={false} /></Row>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Kelola akun dan preferensi kamu</p>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ padding: 8 }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActive(s.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active === s.key ? 'var(--accent-soft)' : 'transparent',
                  color: active === s.key ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, marginBottom: 2, textAlign: 'left',
                }}>
                <s.icon size={15} />{s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="card">{renderContent()}</div>
        </div>
      </div>
    </AppLayout>
  );
}
