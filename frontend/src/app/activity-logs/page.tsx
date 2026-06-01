"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { get, del, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/utils";
import { validateString, runValidators } from "@/lib/validation";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ActivityLog } from "@/lib/types";
import { optimisticCreate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  UPDATE: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  LOGIN: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  LOGOUT: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

export default function ActivityLogsPage(){
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [details, setDetails] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["activity-logs", filterEntity, filterAction],
    queryFn: async() => {
      const params = new URLSearchParams();
      if(filterEntity) params.set("entity", filterEntity);
      if(filterAction) params.set("action", filterAction);
      const res = await get<unknown>(`/activity-logs?${params.toString()}`);
      return Array.isArray(res) ? res : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: { action: string; entity: string; entityId?: string; details?: string }) =>
      api.post("/activity-logs", dto),
    onMutate: async (dto) => {
      const temp: ActivityLog = {
        id: `opt-${Date.now()}`,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId || null,
        details: dto.details || null,
        createdAt: new Date().toISOString(),
      };
      return optimisticCreate(queryClient, ["activity-logs", filterEntity, filterAction], temp);
    },
    onError: (err, dto, context) => {
      rollbackOnError(queryClient, ["activity-logs", filterEntity, filterAction], context);
      addToast(extractApiError(err, "Failed to log activity"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["activity-logs"] }),
    onSuccess: () => {
      setIsModalOpen(false);
      setAction("");
      setEntity("");
      setEntityId("");
      setDetails("");
      addToast("Activity logged", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/activity-logs/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["activity-logs", filterEntity, filterAction], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["activity-logs", filterEntity, filterAction], context);
      addToast(extractApiError(err, "Failed to delete activity"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["activity-logs"] }),
    onSuccess: () => {
      addToast("Activity deleted", "success");
    },
  });

  const filtered = logs.filter((l) => {
    if(!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      (l.details?.toLowerCase().includes(q) ?? false)
    );
  });

  const entities = [...new Set(logs.map((l) => l.entity))];
  const actions = [...new Set(logs.map((l) => l.action))];

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[0,1,2,3,4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track all actions across your account</p>
          <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-sky-400 transition-colors mt-2">
            <ArrowLeft className="w-3 h-3" /> Back to Settings
          </Link>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110"
        >
          <Plus className="w-5 h-5" /> Log Activity
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(v) => setSearchQuery(v)}
          placeholder="Search logs..."
          className="w-full sm:w-56"
        />
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="bg-background border border-border text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="">All Entities</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-background border border-border text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filtered.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "px-2.5 py-1 rounded-lg border text-sm font-semibold uppercase shrink-0",
                ACTION_COLORS[log.action] || "bg-muted text-muted-foreground border-border"
              )}>
                {log.action}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                </p>
                {log.details && (
                  <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
              </span>
              <button
                onClick={() => { setLogToDelete(log.id); setShowDeleteConfirm(true); }}
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                aria-label="Delete log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <EmptyState
            title="No activity logs found"
            description="Actions you take will appear here automatically."
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Activity"
        description="Manually record an activity log entry."
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. CREATE"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Entity</label>
            <input
              type="text"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              placeholder="e.g. Transaction"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Entity ID (optional)</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="UUID"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Details (optional)</label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="JSON or description"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sky-500/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const errors = runValidators(
                validateString(action, "Action", { min: 1, max: 50 }),
                validateString(entity, "Entity", { min: 1, max: 50 })
              );
              if(errors.length > 0){
                addToast(errors[0].message, "error");
                return;
              }
              createMutation.mutate({ action: action.trim().toUpperCase(), entity: entity.trim(), entityId: entityId || undefined, details: details || undefined });
            }}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => { if(logToDelete) deleteMutation.mutate(logToDelete); }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete log?"
        description="Are you sure you want to delete this activity log? This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
