"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Home } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export function SimpleTopBar(){
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async() => {
    try{
      await logout();
      router.push("/");
    } catch{
      // ignore
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-md border-b border-border">
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <Image src="/logo.png" alt="" width={64} height={64} className="rounded-lg" />
        <span className="text-xl font-bold tracking-tight text-foreground">FinPro</span>
      </Link>

      <div className="flex items-center gap-5">
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" /> Home
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{user.username || "User"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-xl transition-all active:scale-[0.98]",
              "bg-white text-gray-900 hover:bg-gray-100"
            )}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
