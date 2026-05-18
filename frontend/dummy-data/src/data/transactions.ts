export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  source: string;
  paymentMethod: string;
  note?: string;
  receiptImage?: string;
}

export const incomeTransactions: Transaction[] = [
  {
    id: "tx-1",
    date: "2025-05-01T10:00:00Z",
    description: "Gaji Bulanan",
    category: "Gaji",
    amount: 15000000,
    source: "manual",
    paymentMethod: "bank transfer",
    note: "Gaji bulan Mei 2025",
  },
  {
    id: "tx-2",
    date: "2025-05-05T14:30:00Z",
    description: "Freelance UI Design",
    category: "Freelance",
    amount: 3500000,
    source: "email",
    paymentMethod: "paypal",
    note: "Project landing page client X",
  },
  {
    id: "tx-3",
    date: "2025-05-10T09:15:00Z",
    description: "Cashback Belanja",
    category: "Bonus",
    amount: 50000,
    source: "manual",
    paymentMethod: "ewallet",
  },
  {
    id: "tx-4",
    date: "2025-04-28T11:00:00Z",
    description: "Bunga Deposito",
    category: "Investasi",
    amount: 250000,
    source: "email",
    paymentMethod: "bank transfer",
  }
];
