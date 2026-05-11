import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const SIDEBAR_KEY = 'ft-sidebar-collapsed';

export default function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      <div className="main-content">
        <Header />
        <main className="page animate-in">{children}</main>
      </div>
    </div>
  );
}
