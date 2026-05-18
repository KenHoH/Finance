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
  }
];

export const investmentSummary = {
  totalValue: 49000000,
  totalInvested: 49000000,
  totalGainLoss: 0,
  totalGainLossPercent: 0.0
};
