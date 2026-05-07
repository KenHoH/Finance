import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/income" element={<Income />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/investments" element={<Investment />} />
        <Route path="/debt" element={<Debt />} />
        <Route path="/saving" element={<Saving />} />
        <Route path="/bills" element={<Bill />} />
        <Route path="/split-bill" element={<SplitBill />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
