import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Target, PieChart,
  Wallet, CreditCard, Receipt, Users, Settings, LogOut,
  Landmark, BookOpen, Split
} from 'lucide-react';
import { currentUser } from '../../data/mock';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { section: 'Transactions' },
  { label: 'Income', icon: TrendingUp, to: '/income' },
  { label: 'Expenses', icon: TrendingDown, to: '/expenses' },
  { section: 'Planning' },
  { label: 'Goals', icon: Target, to: '/goals' },
  { label: 'Budget', icon: PieChart, to: '/budget' },
  { label: 'Saving', icon: Wallet, to: '/saving' },
  { label: 'Debt', icon: CreditCard, to: '/debt' },
  { section: 'More' },
  { label: 'Investments', icon: Landmark, to: '/investments' },
  { label: 'Bills', icon: Receipt, to: '/bills' },
  { label: 'Split Bill', icon: Split, to: '/split-bill' },
  { label: 'Friends', icon: Users, to: '/friends' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <div className="sidebar-logo-text">Fin<span>Track</span></div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-label">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>
      <div className="sidebar-user">
        <div className="user-avatar">{currentUser.avatar}</div>
        <div className="user-info">
          <div className="user-name">{currentUser.name}</div>
          <div className="user-email">{currentUser.email}</div>
        </div>
        <button
          className="icon-btn"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          onClick={() => navigate('/')}
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
