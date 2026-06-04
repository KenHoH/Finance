export interface SavingPoint {
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
  savingPointHistory: SavingPoint[];
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
      { id: "sp-1-1", date: "2025-01-15T00:00:00Z", amount: 5000000, note: "Initial deposit", source: "bca_transfer" },
      { id: "sp-1-2", date: "2025-02-15T00:00:00Z", amount: 5000000, note: "Monthly top-up", source: "bca_transfer" },
      { id: "sp-1-3", date: "2025-03-15T00:00:00Z", amount: 4000000, note: "Monthly top-up", source: "bca_transfer" },
    ],
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
      { id: "sp-2-1", date: "2025-01-10T00:00:00Z", amount: 5000000, note: "Initial buy", source: "gopay" },
      { id: "sp-2-2", date: "2025-02-10T00:00:00Z", amount: 3000000, note: "DCA entry", source: "gopay" },
      { id: "sp-2-3", date: "2025-03-10T00:00:00Z", amount: 2000000, note: "DCA entry", source: "gopay" },
    ],
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
      { id: "sp-3-1", date: "2025-01-05T00:00:00Z", amount: 10000000, note: "Lump sum", source: "ovo" },
      { id: "sp-3-2", date: "2025-03-05T00:00:00Z", amount: 10000000, note: "Additional buy", source: "ovo" },
      { id: "sp-3-3", date: "2025-04-05T00:00:00Z", amount: 5000000, note: "Monthly contribution", source: "ovo" },
    ],
  }
];

export const investmentSummary = {
  totalValue: 49000000,
  totalInvested: 49000000,
  totalGainLoss: 0,
  totalGainLossPercent: 0.0
};
