export interface SavingPointHistory {
  id: string;
  date: string;
  amount: number;
  note: string;
  source: string;
}

export interface InvestmentData {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  platform: string;
  totalValue: number;
  totalInvested: number;
  gainLoss: number;
  gainLossPercent: number;
  lastUpdated: string;
  savingPointHistory: SavingPointHistory[];
}

export const investments: InvestmentData[] = [
  {
    id: "inv-1",
    name: "S&P 500 ETF (VOO)",
    type: "stock",
    icon: "TrendingUp",
    color: "#3b82f6", // blue
    platform: "Ajaib",
    totalValue: 15500000,
    totalInvested: 14000000,
    gainLoss: 1500000,
    gainLossPercent: 10.7,
    lastUpdated: new Date().toISOString(),
    savingPointHistory: [
      { id: "h1", date: "2025-01-10", amount: 5000000, note: "Initial VOO Investment", source: "bank_transfer" },
      { id: "h2", date: "2025-02-12", amount: 4000000, note: "Monthly Top-up", source: "digital_wallet" },
      { id: "h3", date: "2025-03-15", amount: 5000000, note: "Bonus Invest", source: "bank_transfer" }
    ]
  },
  {
    id: "inv-2",
    name: "Bitcoin (BTC)",
    type: "crypto",
    icon: "Bitcoin",
    color: "#f59e0b", // amber
    platform: "Tokocrypto",
    totalValue: 8000000,
    totalInvested: 10000000,
    gainLoss: -2000000,
    gainLossPercent: -20.0,
    lastUpdated: new Date().toISOString(),
    savingPointHistory: [
      { id: "h4", date: "2025-01-15", amount: 5000000, note: "Bought the dip", source: "bank_transfer" },
      { id: "h5", date: "2025-02-20", amount: 5000000, note: "DCA Bitcoin", source: "digital_wallet" }
    ]
  },
  {
    id: "inv-3",
    name: "Reksa Dana Pasar Uang",
    type: "mutual_fund",
    icon: "Landmark",
    color: "#10b981", // emerald
    platform: "Bibit",
    totalValue: 25500000,
    totalInvested: 25000000,
    gainLoss: 500000,
    gainLossPercent: 2.0,
    lastUpdated: new Date().toISOString(),
    savingPointHistory: [
      { id: "h6", date: "2025-01-05", amount: 10000000, note: "Cash Allocation", source: "bank_transfer" },
      { id: "h7", date: "2025-02-05", amount: 10000000, note: "Cash Allocation", source: "bank_transfer" },
      { id: "h8", date: "2025-03-05", amount: 5000000, note: "Cash Allocation", source: "bank_transfer" }
    ]
  }
];

export const investmentSummary = {
  totalValue: 49000000,
  totalInvested: 49000000,
  totalGainLoss: 0,
  totalGainLossPercent: 0.0
};
