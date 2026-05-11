import { Bell, Monitor, Moon, Search, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../pages/Themecontext';

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

const themeOptions = [
  { value: 'light', label: 'Light mode', icon: Sun },
  { value: 'dark', label: 'Dark mode', icon: Moon },
  { value: 'system', label: 'Use system theme', icon: Monitor },
];

export default function Header() {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const base = '/' + pathname.split('/')[1];
  const title = titles[base] || 'FinTrack';

  return (
    <header className="header">
      <span className="header-title">{title}</span>
      <div className="header-actions">
        <div className="theme-toggle" aria-label="Theme picker">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                className={`theme-toggle-btn${theme === option.value ? ' active' : ''}`}
                onClick={() => setTheme(option.value)}
                title={option.label}
                aria-label={option.label}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
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
