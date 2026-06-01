"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, Save, Loader2, User, Mail, Palette, Bell, Globe, Key, Tag, PiggyBank, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { validateString, runValidators } from "@/lib/validation";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Setting } from "@/lib/types";
import { optimisticCreate, optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

const SETTING_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CURRENCY: Globe,
  THEME: Palette,
  NOTIFICATIONS: Bell,
  LANGUAGE: Globe,
};

function getSettingIcon(key: string){
  const normalized = key.toUpperCase();
  return SETTING_ICONS[normalized] || Key;
}

function getSettingLabel(key: string){
  const labels: Record<string, string> = {
    CURRENCY: "Currency",
    THEME: "Theme",
    NOTIFICATIONS: "Notifications",
    LANGUAGE: "Language",
  };
  return labels[key.toUpperCase()] || key;
}

export default function SettingsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [profileName, setProfileName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ["settings"],
    queryFn: () => get<Setting[]>("/settings"),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { key: string; value: string }) => api.post("/settings", dto),
    onMutate: async (dto) => {
      const temp: Setting = { id: `opt-${Date.now()}`, key: dto.key, value: dto.value, createdAt: new Date().toISOString() };
      return optimisticCreate(queryClient, ["settings"], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["settings"], context);
      addToast(extractApiError(err, "Failed to create setting"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
    onSuccess: () => {
      setShowAdd(false);
      setNewKey("");
      setNewValue("");
      addToast("Setting created", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/settings/${key}`, { value }),
    onMutate: async ({ key, value }) => {
      const setting = settings.find((s) => s.key === key);
      return optimisticUpdate(queryClient, ["settings"], setting?.id || key, { value });
    },
    onError: (err, vars, context) => {
      rollbackOnError(queryClient, ["settings"], context);
      addToast(extractApiError(err, "Failed to update setting"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
    onSuccess: () => {
      addToast("Setting updated", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => api.delete(`/settings/${key}`),
    onMutate: async (key) => {
      const setting = settings.find((s) => s.key === key);
      if(!setting) return { previous: [] as Setting[] };
      return optimisticDelete(queryClient, ["settings"], setting.id);
    },
    onError: (err, key, context) => {
      rollbackOnError(queryClient, ["settings"], context);
      addToast(extractApiError(err, "Failed to delete setting"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
    onSuccess: () => {
      addToast("Setting deleted", "success");
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

  if(isLoading){
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-24">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
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
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
      </header>

      {/* Profile Section */}
      {user && (
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
      )}

      {/* Preferences Section */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Preferences</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-5 h-5" /> Add
          </button>
        </div>

        <Modal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          title="Add Preference"
          description="Create a new application preference."
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Setting Name</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. CURRENCY"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-base font-medium"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Value</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. IDR"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-base font-medium"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const errors = runValidators(
                    validateString(newKey, "Setting Name", { min: 1, max: 50 }),
                    validateString(newValue, "Value", { min: 1, max: 100 })
                  );
                  if(errors.length > 0){
                    addToast(errors[0].message, "error");
                    return;
                  }
                  createMutation.mutate({ key: newKey.trim().toUpperCase(), value: newValue.trim() });
                }}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-60"
              >
                <Save className="w-5 h-5" /> Save
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        <div className="space-y-3">
          {settings.map((setting, i) => (
            <SettingRow
              key={setting.id}
              setting={setting}
              index={i}
              onUpdate={(value) => updateMutation.mutate({ key: setting.key, value })}
              onDelete={() => { setSettingToDelete(setting.key); setShowDeleteConfirm(true); }}
              isUpdating={updateMutation.isPending}
            />
          ))}
          {settings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <img src="/empty-mail.png" alt="" className="w-40 h-40 mx-auto mb-2 opacity-70" />
              <p className="font-medium">No preferences set yet</p>
              <p className="text-xs mt-1">Add settings like currency, theme, or notifications</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Tools & Integrations */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-7">
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(settingToDelete) deleteMutation.mutate(settingToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete setting?"
        description="Are you sure you want to delete this setting? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}

function SettingRow({
  setting,
  index,
  onUpdate,
  onDelete,
}: {
  setting: Setting;
  index: number;
  onUpdate: (value: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
}){
  const [editValue, setEditValue] = useState(setting.value);
  const [isEditing, setIsEditing] = useState(false);
  const iconEl = getSettingIcon(setting.key);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-border p-4 bg-card flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {React.createElement(iconEl, { className: "w-4 h-4 text-primary" })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{getSettingLabel(setting.key)}</p>
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              if(editValue !== setting.value) onUpdate(editValue);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if(e.key === "Enter"){
                if(editValue !== setting.value) onUpdate(editValue);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="w-full mt-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
          >
            {setting.value}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Edit"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
