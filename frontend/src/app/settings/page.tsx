"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Mail, Tag, PiggyBank, ArrowRight, LogOut, Wallet, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString } from "@/lib/validation";
import { cn } from "@/lib/utils";

export default function SettingsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [profileName, setProfileName] = useState("");
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const updateProfileMutation = useMutation({
    mutationFn: (dto: { username: string }) => api.patch("/auth/profile", dto),
    onMutate: (dto) => {
      const prev = user;
      useAuthStore.getState().setUser(user ? { ...user, username: dto.username } : null);
      return { previous: prev };
    },
    onError: (err, dto, context) => {
      useAuthStore.getState().setUser(context?.previous ?? null);
      addToast(extractApiError(err, "Failed to update profile"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
    onSuccess: () => {
      addToast("Profile updated", "success");
    },
  });

  if(!user){
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-24">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and tools</p>
      </header>

      {/* Profile Card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <Avatar src={user.avatar} name={user.username || user.email} size="xl" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-foreground">{user.username || "User"}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label htmlFor="profile-name" className="text-sm font-medium text-muted-foreground mb-1 block">Display Name</label>
              <input
                id="profile-name"
                type="text"
                defaultValue={user.username || ""}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <button
              onClick={() => {
                const err = validateString(profileName, "Display Name", { min: 1, max: 50 });
                if(err){
                  addToast(err.message, "error");
                  return;
                }
                updateProfileMutation.mutate({ username: profileName.trim() });
              }}
              disabled={updateProfileMutation.isPending || !profileName}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            >
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
      </motion.section>

      {/* Tools & Integrations */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Tools & Integrations</h2>
        <div className="space-y-2">
          <ToolLink href="/categories" icon={Tag} label="Categories" desc="Manage income and expense categories" color="primary" />
          <ToolLink href="/email" icon={Mail} label="Email Sync" desc="Auto-import transactions from Gmail" color="sky" />
          <ToolLink href="/saving-points" icon={PiggyBank} label="Saving Points" desc="Allocate savings from budgets to goals" color="sky" />
          <ToolLink href="/bills" icon={Wallet} label="Bills" desc="Track and manage recurring bills" color="sky" />
        </div>
      </motion.section>

      {/* Account */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Account</h2>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Log out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              addToast("Logged out", "success");
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors active:scale-[0.98]"
          >
            Log out
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function ToolLink({
  href,
  icon: Icon,
  label,
  desc,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  color: "primary" | "sky";
}) {
  const colorMap = {
    primary: { bg: "bg-primary/10", icon: "text-primary", hover: "group-hover:text-primary" },
    sky: { bg: "bg-sky-500/10", icon: "text-sky-400", hover: "group-hover:text-sky-400" },
  };
  const c = colorMap[color];

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-white/10 transition-all active:scale-[0.99]"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
        <Icon className={cn("w-5 h-5", c.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold text-foreground transition-colors", c.hover)}>{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight className={cn("w-4 h-4 text-muted-foreground transition-colors shrink-0", c.hover)} />
    </Link>
  );
}
