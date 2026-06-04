export const dashboardAccounts = [
  { id: "acc-1", name: "BCA Utama", type: "Bank", balance: 15500000, color: "#10b981" },
  { id: "acc-2", name: "Gopay", type: "E-Wallet", balance: 250000, color: "#3b82f6" },
  { id: "acc-3", name: "OVO", type: "E-Wallet", balance: 150000, color: "#8b5cf6" },
];

export const recentTransactions = [
  { id: "tx-d1", description: "Makan Siang", amount: -45000, date: "2025-05-11T12:30:00Z", type: "expense", category: "Food" },
  { id: "tx-d2", description: "Topup Gopay", amount: -200000, date: "2025-05-11T09:00:00Z", type: "expense", category: "Transfer" },
  { id: "tx-d3", description: "Cashback", amount: 15000, date: "2025-05-10T14:20:00Z", type: "income", category: "Bonus" },
];

export const dashboardGoals = [
  { id: "g-1", name: "Liburan Jepang", target: 30000000, current: 15000000, percentage: 50 },
  { id: "g-2", name: "Dana Darurat", target: 50000000, current: 40000000, percentage: 80 },
];

export const dashboardBudgets = [
  { id: "b-1", category: "Food & Drinks", limit: 3000000, spent: 1500000, percentage: 50, status: "safe" },
  { id: "b-2", category: "Transport", limit: 1000000, spent: 900000, percentage: 90, status: "warning" },
  { id: "b-3", category: "Entertainment", limit: 500000, spent: 550000, percentage: 110, status: "over" },
];
