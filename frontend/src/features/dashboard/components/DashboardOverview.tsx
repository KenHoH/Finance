"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, TrendingUp, PieChart, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency, unwrapArray } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Transaction, Investment, Budget, Goal } from "@/lib/types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 28 } },
};

export function DashboardOverview(){
  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions-all"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions");
      return unwrapArray<Transaction>(res);
    },
  });

  const { data: investmentsData, isLoading: invLoading } = useQuery<Investment[]>({
    queryKey: ["investments"],
    queryFn: async() => {
      const res = await get<unknown>("/investments");
      return unwrapArray<Investment>(res);
    },
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => get<Budget[]>("/budgets"),
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => get<Goal[]>("/goals"),
  });

  const txArray = Array.isArray(transactions) ? transactions : [];
  const totalIncome = txArray.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = txArray.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;
  const totalInvestments = (investmentsData ?? []).reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const activeBudgetsCount = budgets.length;
  const activeGoalsCount = goals.filter((g) => g.status === "IN_PROGRESS").length;
  const isLoading = txLoading || invLoading;

  const stats: {
    title: string;
    value: string;
    trend?: "up" | "down";
    icon: typeof Wallet;
    color: string;
    bgColor: string;
    gradient: string;
    bgImage: string;
  }[] = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      trend: totalBalance >= 0 ? "up" : "down",
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/20",
      gradient: "from-sky-400/40 via-sky-400/10 to-transparent",
      bgImage: "/card-bg-balance.png",
    },
    {
      title: "Total Income",
      value: formatCurrency(totalIncome),
      trend: totalIncome > 0 ? "up" : "down",
      icon: ArrowUpRight,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      gradient: "from-emerald-500/40 via-emerald-500/10 to-transparent",
      bgImage: "/card-bg-income.png",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(totalExpense),
      trend: "down",
      icon: CreditCard,
      color: "text-rose-400",
      bgColor: "bg-rose-500/20",
      gradient: "from-rose-500/40 via-rose-500/10 to-transparent",
      bgImage: "/card-bg-expense.png",
    },
    {
      title: "Total Investments",
      value: formatCurrency(totalInvestments),
      trend: totalInvestments > 0 ? "up" : "down",
      icon: TrendingUp,
      color: "text-sky-300",
      bgColor: "bg-sky-500/20",
      gradient: "from-sky-400/40 via-sky-400/10 to-transparent",
      bgImage: "/card-bg-invest.png",
    },
    {
      title: "Active Budgets",
      value: String(activeBudgetsCount),
      icon: PieChart,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      gradient: "from-amber-500/40 via-amber-500/10 to-transparent",
      bgImage: "/card-bg-budget.png",
    },
    {
      title: "Active Goals",
      value: String(activeGoalsCount),
      icon: Target,
      color: "text-violet-400",
      bgColor: "bg-violet-500/20",
      gradient: "from-violet-500/40 via-violet-500/10 to-transparent",
      bgImage: "/card-bg-goal.png",
    },
  ];

  if(isLoading){
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[140px] rounded-xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative"
    >
      <img src="/card-gradient.png" alt="" className="absolute -top-10 -right-10 w-80 h-80 object-cover opacity-[0.05] pointer-events-none rounded-full blur-3xl" />
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          className={cn(
            "relative overflow-hidden rounded-xl border border-white/[0.08] bg-card/25 p-5 transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
            "bg-gradient-to-br",
            stat.gradient
          )}
        >
          <img src={stat.bgImage} alt="" className="absolute right-0 top-0 h-full w-auto object-cover opacity-[0.3] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            {stat.trend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-sm font-medium px-2 py-1 rounded-md",
                  stat.trend === "up"
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-rose-500/20 text-rose-300"
                )}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.trend === "up" ? "Positive" : "Negative"}
              </span>
            )}
          </div>
          <p className="relative z-10 text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
          <p className="relative z-10 text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
