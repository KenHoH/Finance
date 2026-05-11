"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, TrendingUp, Target, Receipt, Menu, X, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Debts & Savings", href: "/debts", icon: Wallet },
  { name: "Split Bills", href: "/bills", icon: Receipt },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col fixed inset-y-0 left-0 z-50 bg-card border-r border-border shadow-sm">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <PieChart className="w-6 h-6" />
            FinPro
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <PieChart className="w-6 h-6" />
          FinPro
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-64 bg-card border-r border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <PieChart className="w-6 h-6" />
            FinPro
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
