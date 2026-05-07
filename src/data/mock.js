// Mock data for all pages

export const currentUser = {
  name: 'Rizky Pratama',
  email: 'rizky@gmail.com',
  username: 'rizkyp',
  avatar: 'RP',
};

export const accounts = [
  { id: 1, name: 'BCA Tabungan', balance: 12500000, type: 'Bank', icon: '🏦', color: '#3b82f6' },
  { id: 2, name: 'GoPay', balance: 850000, type: 'E-Wallet', icon: '💚', color: '#22c55e' },
  { id: 3, name: 'OVO', balance: 320000, type: 'E-Wallet', icon: '💜', color: '#a855f7' },
  { id: 4, name: 'Mandiri', balance: 5200000, type: 'Bank', icon: '🏛️', color: '#f59e0b' },
  { id: 5, name: 'Dana', balance: 150000, type: 'E-Wallet', icon: '🔵', color: '#3b82f6' },
];

export const incomeTransactions = [
  { id: 1, date: '2025-05-07', description: 'Gaji Bulanan', category: 'Salary', amount: 8500000, source: 'BCA Tabungan' },
  { id: 2, date: '2025-05-05', description: 'Freelance Project UI', category: 'Freelance', amount: 2500000, source: 'GoPay' },
  { id: 3, date: '2025-05-03', description: 'Dividen Saham BBRI', category: 'Investment', amount: 450000, source: 'BCA Tabungan' },
  { id: 4, date: '2025-05-01', description: 'Bonus Q1', category: 'Bonus', amount: 3000000, source: 'BCA Tabungan' },
  { id: 5, date: '2025-04-28', description: 'Konsultasi Desain', category: 'Freelance', amount: 1200000, source: 'OVO' },
  { id: 6, date: '2025-04-25', description: 'Jual Barang Bekas', category: 'Other', amount: 300000, source: 'GoPay' },
  { id: 7, date: '2025-04-20', description: 'Cashback Kartu Kredit', category: 'Cashback', amount: 125000, source: 'Mandiri' },
  { id: 8, date: '2025-04-15', description: 'Proyek Sampingan Web', category: 'Freelance', amount: 1800000, source: 'BCA Tabungan' },
  { id: 9, date: '2025-04-10', description: 'Gaji Paruh Waktu', category: 'Salary', amount: 800000, source: 'GoPay' },
  { id: 10, date: '2025-04-05', description: 'Hasil Survey Online', category: 'Other', amount: 75000, source: 'OVO' },
];

export const expenseTransactions = [
  { id: 1, date: '2025-05-07', description: 'Makan Siang Kantor', category: 'Food', amount: 45000, method: 'GoPay', source: 'GoPay' },
  { id: 2, date: '2025-05-06', description: 'Grab ke Kantor', category: 'Transport', amount: 28000, method: 'GoPay', source: 'GoPay' },
  { id: 3, date: '2025-05-05', description: 'Bayar Listrik PLN', category: 'Utilities', amount: 350000, method: 'Transfer', source: 'BCA Tabungan' },
  { id: 4, date: '2025-05-05', description: 'Netflix Premium', category: 'Entertainment', amount: 54000, method: 'Kartu Kredit', source: 'Mandiri' },
  { id: 5, date: '2025-05-04', description: 'Belanja Groceries', category: 'Food', amount: 285000, method: 'OVO', source: 'OVO' },
  { id: 6, date: '2025-05-03', description: 'Top Up Spotify', category: 'Entertainment', amount: 29000, method: 'Dana', source: 'Dana' },
  { id: 7, date: '2025-05-02', description: 'Bensin Motor', category: 'Transport', amount: 60000, method: 'Cash', source: 'Cash' },
  { id: 8, date: '2025-05-01', description: 'Beli Obat Apotek', category: 'Health', amount: 95000, method: 'GoPay', source: 'GoPay' },
  { id: 9, date: '2025-04-30', description: 'Dinner Anniversary', category: 'Food', amount: 420000, method: 'Kartu Kredit', source: 'Mandiri' },
  { id: 10, date: '2025-04-29', description: 'Kursus Online Udemy', category: 'Education', amount: 189000, method: 'Kartu Kredit', source: 'Mandiri' },
];

export const goals = [
  { id: 1, name: 'Rumah Impian', target: 500000000, current: 125000000, deadline: '2027-12-31', status: 'active', description: 'Tabungan DP rumah di Tangerang', icon: '🏠' },
  { id: 2, name: 'Liburan ke Jepang', target: 25000000, current: 18500000, deadline: '2025-10-01', status: 'active', description: 'Tokyo, Osaka, Kyoto trip', icon: '✈️' },
  { id: 3, name: 'MacBook Pro M4', target: 28000000, current: 28000000, deadline: '2025-04-01', status: 'completed', description: 'Laptop kerja baru', icon: '💻' },
  { id: 4, name: 'Dana Darurat', target: 50000000, current: 35000000, deadline: '2025-12-31', status: 'active', description: '6 bulan pengeluaran', icon: '🛡️' },
  { id: 5, name: 'Motor Baru', target: 30000000, current: 8000000, deadline: '2024-12-31', status: 'expired', description: 'Honda PCX 2024', icon: '🏍️' },
];

export const budgets = [
  { id: 1, category: 'Food', icon: '🍜', budget: 2000000, spent: 1450000, period: 'May 2025', start: '2025-05-01', end: '2025-05-31', threshold: 80 },
  { id: 2, category: 'Transport', icon: '🚗', budget: 800000, spent: 680000, period: 'May 2025', start: '2025-05-01', end: '2025-05-31', threshold: 85 },
  { id: 3, category: 'Entertainment', icon: '🎮', budget: 500000, spent: 530000, period: 'May 2025', start: '2025-05-01', end: '2025-05-31', threshold: 90 },
  { id: 4, category: 'Health', icon: '💊', budget: 600000, spent: 95000, period: 'May 2025', start: '2025-05-01', end: '2025-05-31', threshold: 80 },
  { id: 5, category: 'Education', icon: '📚', budget: 1000000, spent: 189000, period: 'May 2025', start: '2025-05-01', end: '2025-05-31', threshold: 75 },
  { id: 6, category: 'Utilities', icon: '⚡', budget: 1500000, spent: 1620000, period: 'May 2025', start: '2025-05-01', end: '2025-05-31', threshold: 90 },
];

export const investments = [
  { id: 1, name: 'BBRI', type: 'Saham', icon: '📈', invested: 5000000, currentValue: 6250000, lots: 50 },
  { id: 2, name: 'Reksa Dana Schroder', type: 'Reksa Dana', icon: '📊', invested: 10000000, currentValue: 11200000, units: 200 },
  { id: 3, name: 'Bitcoin', type: 'Crypto', icon: '₿', invested: 3000000, currentValue: 2650000, amount: '0.0008 BTC' },
  { id: 4, name: 'TLKM', type: 'Saham', icon: '📶', invested: 4000000, currentValue: 4350000, lots: 40 },
  { id: 5, name: 'Ethereum', type: 'Crypto', icon: '⟠', invested: 2000000, currentValue: 2180000, amount: '0.012 ETH' },
];

export const debts = [
  { id: 1, budgetName: 'Entertainment', budgetAmount: 500000, spent: 530000, debt: 30000, overspendPct: 6 },
  { id: 2, budgetName: 'Utilities', budgetAmount: 1500000, spent: 1620000, debt: 120000, overspendPct: 8 },
];

export const savings = [
  { id: 1, name: 'Tabungan Utama', target: 100000000, current: 45000000, autoDeposit: true, frequency: 'Monthly', amount: 2000000 },
  { id: 2, name: 'Tabungan Lebaran', target: 5000000, current: 3500000, autoDeposit: true, frequency: 'Weekly', amount: 250000 },
  { id: 3, name: 'Tabungan Pendidikan', target: 50000000, current: 12000000, autoDeposit: false, frequency: null, amount: null },
];

export const bills = [
  { id: 1, name: 'Netflix', amount: 54000, frequency: 'Monthly', nextDue: '2025-05-15', status: 'upcoming', category: 'Entertainment', icon: '🎬' },
  { id: 2, name: 'Spotify', amount: 29000, frequency: 'Monthly', nextDue: '2025-05-10', status: 'due_soon', category: 'Entertainment', icon: '🎵' },
  { id: 3, name: 'Listrik PLN', amount: 350000, frequency: 'Monthly', nextDue: '2025-05-05', status: 'overdue', category: 'Utilities', icon: '⚡' },
  { id: 4, name: 'Indihome', amount: 299000, frequency: 'Monthly', nextDue: '2025-05-20', status: 'upcoming', category: 'Utilities', icon: '📡' },
  { id: 5, name: 'BPJS Kesehatan', amount: 150000, frequency: 'Monthly', nextDue: '2025-05-10', status: 'due_soon', category: 'Health', icon: '🏥' },
  { id: 6, name: 'Gym Membership', amount: 200000, frequency: 'Monthly', nextDue: '2025-04-30', status: 'paid', category: 'Health', icon: '💪' },
];

export const splitBills = [
  {
    id: 1, description: 'Dinner di Warung Nasi', date: '2025-05-05', total: 350000,
    status: 'PARTIALLY_PAID', creator: 'Me',
    participants: [
      { name: 'Me', amount: 87500, paid: true },
      { name: 'Budi Santoso', amount: 87500, paid: true },
      { name: 'Citra Dewi', amount: 87500, paid: false },
      { name: 'Dian Rahayu', amount: 87500, paid: false },
    ]
  },
  {
    id: 2, description: 'Wisata Bandung Trip', date: '2025-04-20', total: 1200000,
    status: 'SETTLED', creator: 'Budi Santoso',
    participants: [
      { name: 'Me', amount: 400000, paid: true },
      { name: 'Budi Santoso', amount: 400000, paid: true },
      { name: 'Citra Dewi', amount: 400000, paid: true },
    ]
  },
  {
    id: 3, description: 'Kado Ultah Bos', date: '2025-05-01', total: 500000,
    status: 'PENDING', creator: 'Me',
    participants: [
      { name: 'Me', amount: 250000, paid: true },
      { name: 'Eko Susanto', amount: 250000, paid: false },
    ]
  },
];

export const friends = [
  { id: 1, name: 'Budi Santoso', email: 'budi@gmail.com', avatar: 'BS', activeSplits: 2, iOwe: 87500, theyOwe: 0, since: '2024-01-15', bank: 'BCA 1234567890' },
  { id: 2, name: 'Citra Dewi', email: 'citra@gmail.com', avatar: 'CD', activeSplits: 1, iOwe: 87500, theyOwe: 0, since: '2024-03-10', bank: 'Mandiri 0987654321' },
  { id: 3, name: 'Dian Rahayu', email: 'dian@gmail.com', avatar: 'DR', activeSplits: 1, iOwe: 0, theyOwe: 87500, since: '2023-11-20', bank: 'BNI 1122334455' },
  { id: 4, name: 'Eko Susanto', email: 'eko@gmail.com', avatar: 'ES', activeSplits: 1, iOwe: 0, theyOwe: 250000, since: '2024-06-05', bank: 'BCA 5566778899' },
];

export const trendData = [
  { month: 'Dec', income: 9500000, expense: 6200000 },
  { month: 'Jan', income: 10200000, expense: 7100000 },
  { month: 'Feb', income: 8800000, expense: 5900000 },
  { month: 'Mar', income: 11500000, expense: 8200000 },
  { month: 'Apr', income: 9800000, expense: 6800000 },
  { month: 'May', income: 15750000, expense: 7400000 },
];

export const expensePieData = [
  { name: 'Food', value: 1450000, color: '#f59e0b' },
  { name: 'Transport', value: 680000, color: '#3b82f6' },
  { name: 'Entertainment', value: 530000, color: '#a855f7' },
  { name: 'Utilities', value: 1620000, color: '#ef4444' },
  { name: 'Health', value: 95000, color: '#22c55e' },
  { name: 'Education', value: 189000, color: '#6c63ff' },
];

export const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
