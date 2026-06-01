"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  Wallet,
  Receipt,
  TrendingUp,
  Target,
  ArrowLeft,
  Camera,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency, unwrapArray } from "@/lib/utils";
import { formatDateDisplay } from "@/lib/helpers";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Transaction, Budget, Goal, Investment } from "@/lib/types";

export default function ProfilePage(){
  const user = useAuthStore((s) => s.user);
  const [, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: incomeTxs = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions", "INCOME"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions?type=INCOME");
      return unwrapArray<Transaction>(res);
    },
    enabled: !!user,
  });

  const { data: expenseTxs = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions", "EXPENSE"],
    queryFn: async() => {
      const res = await get<unknown>("/transactions?type=EXPENSE");
      return unwrapArray<Transaction>(res);
    },
    enabled: !!user,
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async() => {
      const res = await get<unknown>("/budgets");
      return unwrapArray<Budget>(res);
    },
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async() => {
      const res = await get<unknown>("/goals");
      return unwrapArray<Goal>(res);
    },
    enabled: !!user,
  });

  const { data: investments = [] } = useQuery<Investment[]>({
    queryKey: ["investments"],
    queryFn: async() => {
      const res = await get<unknown>("/investments");
      return unwrapArray<Investment>(res);
    },
    enabled: !!user,
  });

  const totalIncome = incomeTxs.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = expenseTxs.reduce((s, t) => s + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const handleAvatarChange = async(e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setAvatarFile(file);
    setIsUploading(true);
    // Placeholder for avatar upload - would call API here
    await new Promise((r) => setTimeout(r, 1000));
    setIsUploading(false);
  };

  if(!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent transition-colors hover:bg-accent/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
          <p className="text-xs text-muted-foreground">Your account overview</p>
        </div>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-border relative mb-6 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              src={user.avatar}
              name={user.username || "User"}
              size="lg"
            />
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110">
              {isUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
            </label>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{user.username || "User"}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Joined {formatDateDisplay(user.createdAt || new Date().toISOString())}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: "Net Balance", value: netBalance, icon: Wallet, color: netBalance >= 0 ? "text-emerald-400" : "text-rose-400" },
          { label: "Income", value: totalIncome, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Expenses", value: totalExpense, icon: Receipt, color: "text-rose-400" },
          { label: "Goals", value: goals.length, icon: Target, color: "text-sky-400", isCount: true },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-[10px] font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`mt-1 text-lg font-bold ${stat.color}`}>
              {stat.isCount ? stat.value : formatCurrency(Number(stat.value))}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card glow-border relative rounded-2xl p-5"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Activity Summary</h3>
        <div className="space-y-3">
          {[
            { label: "Total Transactions", value: incomeTxs.length + expenseTxs.length },
            { label: "Active Budgets", value: budgets.length },
            { label: "Savings Goals", value: goals.length },
            { label: "Investments", value: investments.length },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
