"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Wallet, TrendingUp, Target, Receipt, Menu, X, PieChart, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const NAV_LINKS = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Debts & Savings", href: "/debts", icon: Wallet },
  { name: "Split Bills", href: "/bills", icon: Receipt },
  { name: "Playground", href: "/playground", icon: Sparkles },
];

interface NavbarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Navbar({ isMobileMenuOpen, setIsMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Floating Glass Sidebar */}
      <div className="hidden lg:flex h-[calc(100vh-2rem)] w-[260px] flex-col fixed top-4 left-4 z-50 rounded-[2rem] glass-panel shadow-2xl overflow-hidden">
        <div className="flex h-20 items-center px-8">
          <div className="flex items-center gap-3 font-extrabold text-2xl text-primary tracking-tight">
            <div className="bg-primary/20 p-2 rounded-xl">
              <PieChart className="w-7 h-7" />
            </div>
            FinPro
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {/* Magic Sliding Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-primary rounded-2xl shadow-md shadow-primary/30"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110")} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Glass Sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-4 left-4 w-[calc(100%-2rem)] max-w-sm rounded-[2rem] glass-panel shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col overflow-hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%]"
        )}
      >
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-2 font-extrabold text-xl text-primary">
            <PieChart className="w-6 h-6" />
            FinPro
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent transition-colors rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="px-4 py-2 space-y-1 flex-1 overflow-y-auto">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-nav-indicator"
                    className="absolute inset-0 bg-primary rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
