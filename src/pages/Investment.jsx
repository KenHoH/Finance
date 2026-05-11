import { useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Logo from '../components/ui/Logo';
import { investments, fmt } from '../data/mock';
import { INVESTMENT_STORAGE_KEY, normalizeInvestment, readList, toRupiahNumber, writeList } from '../lib/localFinance';

const TYPE_OPTIONS = ['Saham', 'Reksa Dana', 'Crypto', 'Obligasi', 'Emas', 'Lainnya'];

function blankForm() {
  return {
    symbol: '',
    name: '',
    type: 'Saham',
    invested: '',
    currentValue: '',
    units: '',
    logoDomain: '',
    notes: '',
  };
}

export default function Investment() {
  const [portfolio, setPortfolio] = useState(() => readList(INVESTMENT_STORAGE_KEY, investments).map(normalizeInvestment));
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    writeList(INVESTMENT_STORAGE_KEY, portfolio.map(normalizeInvestment));
  }, [portfolio]);

  const totalInvested = useMemo(() => portfolio.reduce((sum, item) => sum + item.invested, 0), [portfolio]);
  const totalValue = useMemo(() => portfolio.reduce((sum, item) => sum + item.currentValue, 0), [portfolio]);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = totalInvested ? ((totalGain / totalInvested) * 100).toFixed(1) : '0.0';
  const bestAsset = portfolio.reduce((best, item) => {
    const gain = item.currentValue - item.invested;
    const pct = item.invested ? gain / item.invested : -Infinity;
    return pct > best.pct ? { name: item.name, pct } : best;
  }, { name: '-', pct: -Infinity });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      symbol: item.symbol || item.name,
      name: item.name,
      type: item.type,
      invested: item.invested,
      currentValue: item.currentValue,
      units: item.units || item.lots || item.amount || '',
      logoDomain: item.logoDomain || '',
      notes: item.notes || '',
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
    const invested = toRupiahNumber(form.invested);
    const currentValue = form.currentValue === '' ? invested : toRupiahNumber(form.currentValue);
    const symbol = form.symbol.trim();
    const name = form.name.trim() || symbol;
    if (!symbol || !name || !invested) return;

    const nextInvestment = {
      id: editingId || Date.now(),
      symbol,
      name,
      type: form.type,
      invested,
      currentValue,
      units: form.units.trim(),
      logoDomain: form.logoDomain.trim(),
      notes: form.notes.trim(),
    };

    setPortfolio((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? nextInvestment : item));
      }
      return [nextInvestment, ...current];
    });
    closeModal();
  };

  const deleteInvestment = (id) => {
    setPortfolio((current) => current.filter((item) => item.id !== id));
  };

  return (
    <AppLayout>
      <div className="page-header page-header-row investment-hero">
        <div>
          <h1 className="page-title">Investasi</h1>
          <p className="page-subtitle">Pantau posisi, nilai, dan performa aset dalam satu tempat.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Plus size={15} /> Tambah Investasi</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card-accent-blue">
          <div className="stat-card-label">Nilai Portfolio</div>
          <div className="stat-card-value">{fmt(totalValue)}</div>
          <div className="stat-card-sub">{portfolio.length} aset aktif</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Gain/Loss</div>
          <div className="stat-card-value" style={{ color: totalGain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalGain >= 0 ? '+' : ''}{fmt(totalGain)}
          </div>
          <div className="stat-card-sub">{totalGainPct}% dari modal</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Top Performer</div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>{bestAsset.name}</div>
          <div className="stat-card-sub">Aset dengan performa terbaik</div>
        </div>
      </div>

      <div className="grid-auto investment-grid">
        {portfolio.map((item) => {
          const gain = item.currentValue - item.invested;
          const pct = item.invested ? ((gain / item.invested) * 100).toFixed(2) : '0.00';
          const isUp = gain >= 0;
          return (
            <div key={item.id} className={`card investment-card ${isUp ? 'is-up' : 'is-down'}`}>
              <div className="investment-card-top">
                <div className="asset-identity">
                  <Logo
                    ticker={item.symbol}
                    name={item.name}
                    type={item.type}
                    domain={item.logoDomain}
                    className="asset-logo asset-logo-lg"
                  />
                  <div>
                    <div className="asset-name">{item.name}</div>
                    <div className="asset-symbol">{item.symbol}</div>
                    <Badge color="muted">{item.type}</Badge>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Nilai Sekarang</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{fmt(item.currentValue)}</div>
                </div>
              </div>

              <div className="investment-metrics">
                <div>
                  <div className="metric-label">Modal</div>
                  <div className="metric-value">{fmt(item.invested)}</div>
                </div>
                <div>
                  <div className="metric-label">Unit/Lot</div>
                  <div className="metric-value">{item.units || '-'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="metric-label">Gain/Loss</div>
                  <div className={`metric-value gain-value ${isUp ? 'amount-green' : 'amount-red'}`}>
                    {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {isUp ? '+' : ''}{fmt(gain)} ({isUp ? '+' : ''}{pct}%)
                  </div>
                </div>
              </div>

              {item.notes && <p className="investment-note">{item.notes}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Eye size={12} /> Detail</button>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEditModal(item)} aria-label="Edit investasi"><Edit2 size={12} /></button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteInvestment(item.id)} aria-label="Hapus investasi"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal
          title={editingId ? 'Edit Investasi' : 'Tambah Investasi'}
          onClose={closeModal}
          footer={(
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
              <button className="btn btn-primary" type="submit" form="investment-form">Simpan</button>
            </>
          )}
        >
          <form id="investment-form" onSubmit={handleSubmit}>
            <div className="asset-preview">
              <Logo
                ticker={form.symbol}
                name={form.name || form.symbol || 'Asset'}
                type={form.type}
                domain={form.logoDomain}
                className="asset-logo asset-logo-xl"
              />
              <div>
                <div className="asset-preview-title">{form.name || form.symbol || 'Preview aset'}</div>
                <div className="asset-preview-sub">{form.symbol ? `${form.symbol} - ${form.type}` : 'Belum ada aset dipilih'}</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ticker / Kode Aset</label>
                <input className="form-input" value={form.symbol} onChange={(event) => updateForm('symbol', event.target.value)} placeholder="Contoh: BBRI, AAPL, BTC" required />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Display</label>
                <input className="form-input" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Contoh: Bank BRI" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="form-input" value={form.type} onChange={(event) => updateForm('type', event.target.value)}>
                  {TYPE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit / Lot</label>
                <input className="form-input" value={form.units} onChange={(event) => updateForm('units', event.target.value)} placeholder="Contoh: 50 lot" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Modal (IDR)</label>
                <input className="form-input" value={form.invested} onChange={(event) => updateForm('invested', event.target.value)} type="number" min="0" placeholder="0" required />
              </div>
              <div className="form-group">
                <label className="form-label">Nilai Sekarang (IDR)</label>
                <input className="form-input" value={form.currentValue} onChange={(event) => updateForm('currentValue', event.target.value)} type="number" min="0" placeholder="Kosongkan jika sama dengan modal" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website Logo (Opsional)</label>
              <input className="form-input" value={form.logoDomain} onChange={(event) => updateForm('logoDomain', event.target.value)} placeholder="Contoh: bri.co.id" />
            </div>

            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea className="form-input" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} rows={3} placeholder="Opsional..." />
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
