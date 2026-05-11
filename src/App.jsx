import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Budget from './pages/Budget';
import Investment from './pages/Investment';
import Debt from './pages/Debt';
import Saving from './pages/Saving';
import Bill from './pages/Bill';
import SplitBill from './pages/SplitBill';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import { getCurrentUser } from './lib/api';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    setStatus('checking');

    getCurrentUser()
      .then((user) => {
        if (!active) return;
        setStatus(user ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (active) setStatus('guest');
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (status === 'checking') {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">FT</div>
          <h1 className="login-title">FinTrack</h1>
          <p className="login-sub">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

function protectedPage(page) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/income" element={protectedPage(<Income />)} />
        <Route path="/expenses" element={protectedPage(<Expenses />)} />
        <Route path="/goals" element={protectedPage(<Goals />)} />
        <Route path="/budget" element={protectedPage(<Budget />)} />
        <Route path="/investments" element={protectedPage(<Investment />)} />
        <Route path="/debt" element={protectedPage(<Debt />)} />
        <Route path="/saving" element={protectedPage(<Saving />)} />
        <Route path="/bills" element={protectedPage(<Bill />)} />
        <Route path="/split-bill" element={protectedPage(<SplitBill />)} />
        <Route path="/friends" element={protectedPage(<Friends />)} />
        <Route path="/settings" element={protectedPage(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
