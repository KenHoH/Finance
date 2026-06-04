"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Mail, Tag, PiggyBank, ArrowRight, LogOut, Wallet, Clock, CalendarDays, CheckCircle2, Settings2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, get, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface SettingItem {
  id: string;
  userId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

const BUDGET_TIME_OPTIONS: { value: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "DAILY", label: "Daily", desc: "Track budget usage on a daily basis", icon: Clock },
  { value: "MONTHLY", label: "Monthly", desc: "Track budget usage over the full period", icon: CalendarDays },
];

export default function SettingsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [profileName, setProfileName] = useState("");
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Fetch all user settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery<SettingItem[]>({
    queryKey: ["settings"],
    queryFn: () => get<SettingItem[]>("/settings"),
  });

  const budgetTimePref = settings.find((s) => s.key === "BUDGET_TIME_PREFERENCE");
  const currentBudgetTime = budgetTimePref?.value ?? "MONTHLY";

  const updateSettingMutation = useMutation({
    mutationFn: (dto: { key: string; value: string }) =>
      api.put(`/settings/${dto.key}`, { value: dto.value }),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: ["settings"] });
      const previous = queryClient.getQueryData<SettingItem[]>(["settings"]);
      queryClient.setQueryData<SettingItem[]>(["settings"], (old = []) => {
        const exists = old.find((s) => s.key === dto.key);
        if (exists) {
          return old.map((s) => (s.key === dto.key ? { ...s, value: dto.value } : s));
        }
        return [...old, { id: `opt-${Date.now()}`, userId: "", key: dto.key, value: dto.value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      });
      return { previous };
    },
    onError: (err, _dto, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["settings"], context.previous);
      }
      addToast(extractApiError(err, "Failed to update setting"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
    onSuccess: () => {
      addToast("Preference updated", "success");
    },
  });

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
          <Avatar src={user.avatar} name={user.username || user.email} size="xl" />
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

      {/* Preferences */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5" />
          Preferences
        </h2>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {/* Budget Time Preference */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">Budget Time Preference</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose how your budget spending is monitored and alerts are triggered
              </p>
            </div>
            {settingsLoading ? (
              <div className="flex gap-3">
                <Skeleton className="h-20 flex-1" />
                <Skeleton className="h-20 flex-1" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUDGET_TIME_OPTIONS.map((opt) => {
                  const isActive = currentBudgetTime === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      id={`pref-budget-time-${opt.value.toLowerCase()}`}
                      onClick={() => {
                        if (!isActive) {
                          updateSettingMutation.mutate({ key: "BUDGET_TIME_PREFERENCE", value: opt.value });
                        }
                      }}
                      disabled={updateSettingMutation.isPending}
                      className={cn(
                        "group relative flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        isActive
                          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.1)]"
                          : "border-border hover:border-primary/30 hover:bg-accent/30",
                        updateSettingMutation.isPending && "opacity-60 pointer-events-none"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isActive ? "bg-primary/15 text-primary" : "bg-accent text-muted-foreground group-hover:text-foreground"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-bold transition-colors",
                          isActive ? "text-primary" : "text-foreground"
                        )}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3"
                        >
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
