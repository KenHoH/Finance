"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, Menu, Sparkles, Home, Wallet, TrendingUp, Target, Receipt, PieChart } from "lucide-react";

interface TopNavbarProps {
  onOpenMobileMenu?: () => void;
}

export function TopNavbar({ onOpenMobileMenu }: TopNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    router.push("/login");
  };

  // Map path to page title
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Financial Dashboard";
      case "/income":
        return "Income & Revenues";
      case "/expenses":
        return "Expense Tracker";
      case "/goals":
        return "Financial Goals";
      case "/budgets":
        return "Budget Planner";
      case "/investments":
        return "Investments Portfolio";
      case "/debts":
        return "Debts & Savings";
      case "/bills":
        return "Split Bills";
      case "/playground":
        return "Interactive Playground";
      default:
        return "FinPro Dashboard";
    }
  };

  // Initials for avatar
  const initials = user && user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : "US";

  return (
    <header className="w-full mb-6">
      {/* Unified glassmorphic navbar */}
      <div className="glass-panel rounded-3xl px-6 py-4 flex items-center justify-between shadow-lg border border-border relative overflow-hidden">
        {/* Subtle decorative top glow */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Left Side: Page Title or Welcome Message */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle button */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-primary hover:bg-primary/10 rounded-xl transition-all border border-border/50 hover:border-primary/50 active:scale-95 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text flex items-center gap-2">
              {pathname === "/playground" && <Sparkles className="w-5 h-5 text-primary animate-pulse" />}
              {getPageTitle()}
            </h2>
            {user && (
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Welcome back, <span className="text-primary font-bold">{user.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Side: User Profile & Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 bg-secondary/30 pl-3 pr-4 py-1.5 rounded-2xl border border-border/40 hover:border-primary/20 transition-all cursor-default group relative">
              {/* Profile Logo/Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md relative overflow-hidden">
                <span className="relative z-10">{initials}</span>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* User name & email details */}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-foreground leading-tight">{user.name}</span>
                <span className="text-[10px] text-muted-foreground font-semibold leading-tight">{user.email}</span>
              </div>

              {/* High-Fidelity Custom Tooltip */}
              <div className="absolute top-12 right-0 bg-card border border-border p-4 rounded-2xl shadow-xl w-60 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[100] flex flex-col gap-2">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[130px]">{user.email}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-left py-1 font-medium">
                  Account Status: <span className="text-emerald-500 font-bold">VIP Premium</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95 group shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
