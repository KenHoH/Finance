"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Wallet,
  TrendingUp,
  Target,
  Receipt,
  PieChart,
  LogOut,
  Landmark,
  ArrowLeftRight,
  User,
  ChevronDown,
  Users,
  Bell,
  Settings,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { cn, unwrapArray } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api } from "@/lib/api";
import type { NavItem, Notification } from "@/lib/types";

function AvatarImg({ src, size = "md" }: { src?: string | null; size?: "sm" | "md" }){
  const [error, setError] = useState(false);
  const isSm = size === "sm";
  if(!src || error){
    return (
      <div className={cn("rounded-full bg-primary/10 flex items-center justify-center", isSm ? "w-9 h-9" : "w-10 h-10")}>
        <User className={cn("text-primary", isSm ? "w-4 h-4" : "w-5 h-5")} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={cn("rounded-full object-cover", isSm ? "w-9 h-9 ring-1 ring-sky-500/10" : "w-10 h-10")}
      onError={() => setError(true)}
    />
  );
}

const PRIMARY_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: PieChart },
];

const MORE_ITEMS: NavItem[] = [
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Bills", href: "/bills", icon: FileText },
  { name: "Debts", href: "/debts", icon: Landmark },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Split Bills", href: "/split-bills", icon: ArrowLeftRight },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: raw = [] } = useQuery<unknown>({
    queryKey: ["notifications"],
    queryFn: () => get<unknown>("/notifications"),
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const notifications = unwrapArray<Notification>(raw).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if(profileRef.current && !profileRef.current.contains(event.target as Node)){
        setIsProfileOpen(false);
      }
      if(moreRef.current && !moreRef.current.contains(event.target as Node)){
        setIsMoreOpen(false);
      }
      if(notifRef.current && !notifRef.current.contains(event.target as Node)){
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async() => {
    setIsProfileOpen(false);
    try{
      await logout();
    } catch{
      // ignore
    }
    router.push("/");
  };

  return (
    <>
      {/* Desktop: Floating Top-Center Nav Pill */}
      <div className="hidden lg:flex items-center justify-center fixed top-4 inset-x-0 z-[60] pointer-events-none">
        <nav className="pointer-events-auto flex items-center gap-0.5 px-1.5 py-1.5 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-black/10">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="top-nav-active"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                isMoreOpen || MORE_ITEMS.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03]"
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </button>
            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.14 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-card/95 backdrop-blur-xl border border-border rounded-xl p-1.5 shadow-2xl z-[70]"
                >
                  {MORE_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03]"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { setIsMoreOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* Desktop: Top-Right Actions */}
      <div className="hidden lg:flex items-center gap-2 fixed top-4 right-4 z-[60]">
        {/* Notifications bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors",
              isNotifOpen
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03]"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-[1.1rem] h-[1.1rem]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-[70] overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <Link
                    href="/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <Link
                        key={n.id}
                        href="/notifications"
                        onClick={() => { if(!n.isRead) markRead.mutate(n.id); setIsNotifOpen(false); }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors",
                          !n.isRead && "bg-primary/5"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", n.isRead ? "bg-transparent" : "bg-primary")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile pill */}
        <div ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 px-3 py-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl hover:bg-sky-500/[0.03] transition-colors shadow-lg"
          >
            <AvatarImg src={user?.avatar} size="sm" />
            <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{user?.username || "User"}</span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isProfileOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl p-1.5 shadow-2xl z-50"
              >
                <div className="px-3 py-2.5 mb-1 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">{user?.username || "User"}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
                <Link
                  href="/friends"
                  onClick={() => setIsProfileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/friends" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03]"
                  )}
                >
                  <Users className="w-4 h-4" />
                  Friends
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/settings" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.03]"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile: Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border z-[60] flex items-center justify-around px-2 safe-area-pb">
        {PRIMARY_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-colors",
            pathname === "/settings" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </Link>
      </nav>
    </>
  );
}
