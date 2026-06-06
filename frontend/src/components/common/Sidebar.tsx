"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Wallet,
  TrendingUp,
  Target,
  CreditCard,
  PieChart,
  Landmark,
  ArrowLeftRight,
  FileText,
  PiggyBank,
  Menu,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/useSidebarStore";
import type { NavItem } from "@/lib/types";

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Saving Points", href: "/saving-points", icon: PiggyBank },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Bills", href: "/bills", icon: FileText },
  { name: "Debts", href: "/debts", icon: Landmark },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Split Bills", href: "/split-bills", icon: ArrowLeftRight },
];

export function Sidebar(){
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggle);
  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null);

  const showTooltip = useCallback((text: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setTooltip({ text, top: rect.top + rect.height / 2 });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const renderNavLink = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        onMouseEnter={(e) => collapsed && showTooltip(item.name, e.currentTarget)}
        onMouseLeave={hideTooltip}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sky-500/[0.08] text-sky-400"
            : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.04]",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("w-[1.15rem] h-[1.15rem] transition-colors shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
        {!collapsed && <span className="relative z-10">{item.name}</span>}
        {isActive && !collapsed && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 w-[3px] h-6 bg-primary rounded-r-full"
            initial={false}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Toggle */}
      <div className={cn("flex items-center justify-between pt-6 pb-4", collapsed ? "px-2 justify-center" : "px-4")}>
        {collapsed ? (
          <button
            onClick={toggleCollapsed}
            className="group relative flex items-center justify-center w-12 h-12 rounded-lg transition-colors"
            aria-label="Expand sidebar"
          >
            <img src="/logo.png" alt="" className="w-12 h-12 rounded-lg shrink-0 group-hover:hidden" />
            <PanelLeft className="w-6 h-6 text-primary hidden group-hover:block" />
            <span className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[60] shadow-lg border border-slate-700">
              Expand sidebar
            </span>
          </button>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <img src="/logo.png" alt="" className="w-14 h-14 rounded-lg shrink-0" />
            <span className="text-xl font-bold text-foreground tracking-tight">FinPro</span>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="hidden lg:block p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.04] transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav data-tour="sidebar" className={cn("flex-1 overflow-y-auto py-2 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {NAV_ITEMS.map(renderNavLink)}
      </nav>

      {collapsed && (
        <div className="px-2 py-3 border-t border-border">
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.04] transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeft className="w-[1.15rem] h-[1.15rem]" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[70] w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn("hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300", collapsed ? "w-[4.5rem]" : "w-[16rem]")}
      >
        {sidebarContent}
        {/* Fixed tooltip outside nav to avoid overflow clipping */}
        {collapsed && tooltip && (
          <div
            className="fixed left-[4.2rem] z-[70] px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg border border-slate-700 pointer-events-none"
            style={{ top: tooltip.top, transform: "translateY(-50%)" }}
          >
            {tooltip.text}
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[16rem] bg-card border-r border-border z-[70]"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-sky-500/[0.05] rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <PanelLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
