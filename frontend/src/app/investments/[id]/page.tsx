"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Plus,
  History,
  Info,
  CreditCard
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { investments, type SavingPoint } from "@/dummy-data/src/data/investments";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function InvestmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const data = useMemo(() => investments.find((i) => i.id === id), [id]);

  // Generate chart data based on history (Cumulative invested vs actual value)
  // For dummy visual purposes, we'll construct a simple timeline
  const chartData = useMemo(() => {
    if (!data) return [];
    let cumulative = 0;
    const historyData = [...data.savingPointHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return historyData.map((h) => {
      cumulative += h.amount;
      // Add a slight random factor to simulate market movement for "Value", making it diverge from invested
      const randomMarketEffect = 1 + (Math.random() * 0.1 - 0.02); // -2% to +8% roughly
      const estimatedValue = cumulative * (data.gainLossPercent >= 0 ? randomMarketEffect : 0.95);
      
      return {
        date: format(parseISO(h.date), "dd MMM yyyy"),
        invested: cumulative,
        value: estimatedValue,
      };
    });
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground flex-col gap-4">
        <Info className="w-12 h-12" />
        <h2 className="text-xl font-bold">Investment Not Found</h2>
        <button 
          onClick={() => router.push('/investments')}
          className="text-primary hover:underline font-medium"
        >
          Return to Investments
        </button>
      </div>
    );
  }

  const isPositive = data.gainLoss >= 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm"
              style={{ backgroundColor: `${data.color}20`, color: data.color }}
            >
              {data.icon}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {data.name}
              </h1>
              <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-muted-foreground capitalize mt-1 border border-border/50">
                {data.type.replace("_", " ")} &bull; {data.platform}
              </span>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Top Up
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                Current Value
              </p>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                {formatCurrency(data.totalValue)}
              </h2>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Total Invested</span>
                <span className="font-semibold">{formatCurrency(data.totalInvested)}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "rounded-3xl border p-6 shadow-sm",
                isPositive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
              )}
            >
              <p className={cn(
                "text-sm font-bold mb-1 uppercase tracking-wide flex items-center gap-2",
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Total Return
              </p>
              <h2 className={cn(
                "text-3xl font-extrabold tracking-tight",
                 isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
              )}>
                {isPositive ? "+" : ""}
                {formatCurrency(data.gainLoss)}
              </h2>
              <div className="mt-4 pt-4 border-t border-current/10 flex items-center justify-between">
                <span className="text-sm font-medium opacity-80">Percentage</span>
                <span className="font-bold text-lg">{isPositive ? "+" : ""}{data.gainLossPercent}%</span>
              </div>
            </motion.div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-card-foreground mb-6">Performance History</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={data.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={data.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                    dx={-10}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--card-foreground)' }}
                    itemStyle={{ fontWeight: 600 }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Area
                    type="monotone"
                    name="Estimated Value"
                    dataKey="value"
                    stroke={data.color}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                  <Area
                    type="step"
                    name="Invested Amount"
                    dataKey="invested"
                    stroke="var(--muted-foreground)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                 Estimated Value
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 border-2 border-dashed border-muted-foreground rounded-full" />
                 Invested Amount
               </div>
            </div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full"
        >
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Saving Point History
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tracked contributions to this asset
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="relative border-l-2 border-border ml-3 space-y-8">
              {data.savingPointHistory.map((history: SavingPoint, idx: number) => (
                <div key={history.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                  
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {format(parseISO(history.date), "dd MMM yyyy")}
                  </div>
                  
                  <div className="bg-background rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow group cursor-default">
                     <div className="flex justify-between items-start mb-2">
                       <span className="font-semibold text-foreground">{history.note}</span>
                       <span className="font-bold text-primary whitespace-nowrap ml-4">
                         +{formatCurrency(history.amount)}
                       </span>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-accent w-fit px-2 py-1 rounded-md capitalize">
                       <CreditCard className="w-3.5 h-3.5" />
                       {history.source.replace("_", " ")}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
