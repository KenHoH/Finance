"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Loader2, User, Mail, Tag, PiggyBank, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString } from "@/lib/validation";

export default function SettingsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [profileName, setProfileName] = useState("");
  const user = useAuthStore((s) => s.user);

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
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and tools</p>
        </div>
      </header>

      {/* Profile Section */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-7">
        <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Profile
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label htmlFor="profile-name" className="text-sm font-medium text-muted-foreground mb-1 block">Display Name</label>
            <input
              id="profile-name"
              type="text"
              defaultValue={user.username || ""}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all"
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
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
          >
            {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
            Save
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          {user.email}
        </div>
      </motion.section>

      {/* Tools & Integrations */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7">
        <h2 className="text-lg font-bold text-foreground mb-5">Tools & Integrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/categories" className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Categories</p>
              <p className="text-xs text-muted-foreground">Manage income and expense categories</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link href="/email" className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-sky-400 transition-colors">Email Sync</p>
              <p className="text-xs text-muted-foreground">Auto-import transactions from Gmail</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-400 transition-colors" />
          </Link>
          <Link href="/saving-points" className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-sky-400 transition-colors">Saving Points</p>
              <p className="text-xs text-muted-foreground">Allocate savings from budgets to goals</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-400 transition-colors" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
