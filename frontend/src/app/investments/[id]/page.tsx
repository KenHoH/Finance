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
  Calendar as CalendarIcon,
  History,
  Info,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency, unwrapArray } from "@/lib/utils";
import type { Investment, Allocation } from "@/lib/types";

export default function InvestmentDetailPage(){
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: investment, isLoading } = useQuery<Investment>({
    queryKey: ["investment", id],
    queryFn: () => get(`/investments/${id}`),
  });

  const { data: allocations = [] } = useQuery<Allocation[]>({
    queryKey: ["investment-allocations", investment?.categoryId],
    queryFn: async() => {
      const res = await get<unknown>(`/investments/allocations/category/${investment!.categoryId}`);
      return unwrapArray<Allocation>(res);
    },
    enabled: !!investment?.categoryId,
  });

  const chartData = useMemo(() => {
    if(!allocations.length) return [];
    const sorted = [...allocations].sort(
      (a, b) => new Date(a.allocationDate).getTime() - new Date(b.allocationDate).getTime()
    );
    let cumulative = 0;
    return sorted.map((a) => {
      cumulative += Number(a.amount);
      return {
        date: format(new Date(a.allocationDate), "dd MMM yyyy"),
        invested: cumulative,
      };
    });
  }, [allocations]);

  if(isLoading){
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if(!investment){
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground flex-col gap-5">
        <Info className="w-12 h-12" />
        <h2 className="text-xl font-bold">Investment Not Found</h2>
        <button
          onClick={() => router.push("/investments")}
          className="text-primary hover:underline font-medium"
        >
          Return to Investments
        </button>
      </div>
    );
  }

  const totalAmount = Number(investment.totalAmount);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {investment.category.name}
            </h1>
            <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-muted-foreground capitalize mt-1 border border-border/50">
              {investment.category.icon ?? "Investment"}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Total Invested
            </p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalAmount)}
            </h2>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Allocations</span>
              <span className="font-semibold">{allocations.length} entries</span>
            </div>
          </motion.div>

          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-card-foreground mb-6">Investment Growth</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                      dx={-10}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", color: "var(--card-foreground)" }}
                      itemStyle={{ fontWeight: 600 }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Area
                      type="monotone"
                      name="Cumulative Invested"
                      dataKey="invested"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorInvested)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full"
        >
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Allocation History
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tracked contributions to this investment
            </p>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {allocations.length === 0 ? (
              <div className="text-center py-6">
                <img src="/empty-investment.png" alt="" className="w-40 h-40 mx-auto mb-2 opacity-70" />
                <p className="text-sm text-muted-foreground">No allocations yet.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-border ml-3 space-y-8">
                {allocations.map((alloc) => (
                  <div key={alloc.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {format(new Date(alloc.allocationDate), "dd MMM yyyy")}
                    </div>
                    <div className="bg-background rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-foreground">{alloc.note || "Allocation"}</span>
                        <span className="font-bold text-primary whitespace-nowrap ml-4">
                          +{formatCurrency(Number(alloc.amount))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
