"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Utility for formatting Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

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

interface InvestmentCardProps {
  data: InvestmentData;
  onAddTransaction?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function InvestmentCard({
  data,
  onAddTransaction,
  onEdit,
  onDelete,
}: InvestmentCardProps) {
  const isPositive = data.gainLoss >= 0;
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
            style={{ backgroundColor: `${data.color}20`, color: data.color }}
          >
            {data.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-card-foreground line-clamp-1">
              {data.name}
            </h3>
            <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-muted-foreground capitalize mt-1">
              {data.type.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95">
                <Link
                  href={`/investments/${data.id}`}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Eye className="h-4 w-4" /> View Details
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAddTransaction?.(data.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Transaction
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(data.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete?.(data.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Value
          </p>
          <p className="text-2xl font-extrabold text-foreground tracking-tight">
            {formatCurrency(data.totalValue).replace(",00", "")}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Invested
            </p>
            <p className="font-semibold text-foreground">
              {formatCurrency(data.totalInvested).replace(",00", "")}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Return
            </p>
            <div
              className={cn(
                "flex items-center gap-1 font-bold",
                isPositive ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}
              {formatCurrency(data.gainLoss).replace(",00", "")} (
              {data.gainLossPercent}%)
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
