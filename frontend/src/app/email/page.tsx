"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mail, RefreshCw, Inbox, ArrowDownToLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { EmailTransaction } from "@/lib/types";

export default function EmailPage(){
  const { data, isLoading, refetch } = useQuery<{
    extracted?: { emailId: string; amount: number; recipient?: string; date?: string }[];
    created?: EmailTransaction[];
    skipped?: number;
  }>({
    queryKey: ["email-sync"],
    queryFn: async() => {
      return await get<{
        extracted?: { emailId: string; amount: number; recipient?: string; date?: string }[];
        created?: EmailTransaction[];
        skipped?: number;
      }>("/email");
    },
  });

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[0,1,2,3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const created = data?.created || [];
  const skipped = data?.skipped || 0;
  const extracted = data?.extracted || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-sky-400" />
            </div>
            Email Sync
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-import transactions from Gmail receipts</p>
          <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-sky-400 transition-colors mt-2">
            <ArrowLeft className="w-3 h-3" /> Back to Settings
          </Link>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <RefreshCw className="w-5 h-5" /> Sync Now
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Emails Scanned</p>
          <p className="text-3xl font-bold text-foreground">{extracted.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">New Transactions</p>
          <p className="text-3xl font-bold text-sky-400">{created.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Skipped (Already Exist)</p>
          <p className="text-3xl font-bold text-muted-foreground">{skipped}</p>
        </motion.div>
      </div>

      {/* Created Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ArrowDownToLine className="w-4 h-4 text-muted-foreground" />
          Imported Transactions
        </h3>
        <div className="space-y-2">
          {created.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <Inbox className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-rose-400 shrink-0">-{formatCurrency(Number(tx.amount))}</span>
            </motion.div>
          ))}
          {created.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              <img src="/empty-mail.webp" alt="" className="w-40 h-40 mx-auto mb-2 opacity-70" />
              <p className="font-medium">No new transactions from email</p>
              <p className="text-sm mt-1">Click Sync Now to scan your Gmail inbox</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
