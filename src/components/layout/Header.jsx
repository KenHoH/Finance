import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/dashboard': 'Dashboard',
  '/income': 'Income',
  '/expenses': 'Expenses',
  '/goals': 'Goals',
  '/budget': 'Budget',
  '/saving': 'Saving',
  '/debt': 'Debt',
  '/investments': 'Investments',
  '/bills': 'Bills',
  '/split-bill': 'Split Bill',
  '/friends': 'Friends',
  '/settings': 'Settings',
};

export default function Header() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const title = titles[base] || 'FinTrack';
  return (
    <header className="header">
      <span className="header-title">{title}</span>
      <div className="header-actions">
        <button className="icon-btn"><Search size={15} /></button>
        <button className="icon-btn" style={{ position: 'relative' }}>
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444', border: '1.5px solid var(--bg-secondary)'
          }} />
        </button>
      </div>
    </header>
  );
}
