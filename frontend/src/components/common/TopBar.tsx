"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Settings, LogOut, Users, Bell } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, unwrapArray } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { useSidebarStore } from "@/store/useSidebarStore";
import type { Notification } from "@/lib/types";

function AvatarImg({ src, className }: { src?: string | null; className?: string }){
  const [error, setError] = useState(false);
  if(!src || error){
    return (
      <div className={cn("w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-white/10", className)}>
        <User className="w-5 h-5 text-primary" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={cn("w-9 h-9 rounded-full object-cover border border-white/10", className)}
      onError={() => setError(true)}
    />
  );
}

export function TopBar(){
  const router = useRouter();
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: raw = [] } = useQuery<unknown>({
    queryKey: ["notifications"],
    queryFn: () => get<unknown>("/notifications"),
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const notifications = unwrapArray<Notification>(raw);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async() => {
    try{
      await logout();
    } catch{
      // ignore
    }
    setShowLogoutConfirm(false);
    router.push("/");
  };

  if(!user) return null;

  const linkClass = (href: string) => cn(
    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
    pathname === href || pathname.startsWith(`${href}/`)
      ? "bg-sky-500/[0.08] text-sky-400"
      : "text-muted-foreground hover:text-foreground hover:bg-sky-500/[0.04]"
  );

  return (
    <>
    <div data-tour="topbar" className={cn("fixed top-0 right-0 h-16 z-40 flex items-center justify-end gap-2 px-4 sm:px-6 bg-card/80 backdrop-blur-md border-b border-border transition-all duration-300", collapsed ? "left-0 lg:left-[4.5rem]" : "left-0 lg:left-[16rem]")}>
      <Link href="/friends" className={linkClass("/friends")}>
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Friends</span>
      </Link>

      <Link href="/settings" className={linkClass("/settings")}>
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </Link>

      <Link href="/notifications" className={linkClass("/notifications")} aria-label="Notifications">
        <div className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </Link>

      <div className="w-px h-6 bg-border mx-1" />

      <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-sky-500/[0.03] border border-sky-500/10">
        <AvatarImg src={user.avatar} />
        <span className="text-sm font-semibold text-foreground hidden md:inline">{user.username || "User"}</span>
      </div>

      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label="Log out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>

    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
          <h3 className="text-lg font-bold text-foreground mb-2">Log out?</h3>
          <p className="text-sm text-muted-foreground mb-5">Are you sure you want to log out of FinPro?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl font-bold bg-accent text-foreground hover:bg-accent/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
