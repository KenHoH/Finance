"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
  Receipt,
  Target,
  Info,
  ArrowLeftRight,
  UserCheck,
  UserX,
  DollarSign,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, unwrapArray } from "@/lib/utils";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Notification } from "@/lib/types";
import { optimisticUpdate, optimisticDelete, rollbackOnError } from "@/lib/optimistic";

type FilterTab = "all" | "unread";

function safeFormatDate(dateValue: string | Date | null | undefined, fmt: string): string {
  if(!dateValue) return "";
  const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if(isNaN(d.getTime())) return "";
  try {
    return format(d, fmt);
  } catch {
    return "";
  }
}

function getTypeMeta(type: string){
  switch(type){
    case "BILL_REMINDER":
      return { icon: Receipt, color: "text-sky-300", bg: "bg-sky-500/20", label: "Bill" };
    case "BUDGET_ALERT":
      return { icon: AlertTriangle, color: "text-amber-300", bg: "bg-amber-500/20", label: "Budget" };
    case "GOAL_UPDATE":
      return { icon: Target, color: "text-sky-300", bg: "bg-sky-500/20", label: "Goal" };
    case "SPLIT_BILL_INVITE":
      return { icon: ArrowLeftRight, color: "text-sky-300", bg: "bg-sky-500/20", label: "Split Bill" };
    case "SPLIT_BILL_PAID":
      return { icon: DollarSign, color: "text-amber-300", bg: "bg-amber-500/20", label: "Payment" };
    case "SPLIT_BILL_CONFIRMED":
      return { icon: UserCheck, color: "text-emerald-300", bg: "bg-emerald-500/20", label: "Confirmed" };
    case "SPLIT_BILL_REJECTED":
      return { icon: UserX, color: "text-rose-300", bg: "bg-rose-500/20", label: "Rejected" };
    default:
      return { icon: Info, color: "text-slate-300", bg: "bg-slate-500/20", label: "System" };
  }
}

function SkeletonCard(){
  return (
    <div className="rounded-xl border border-border p-5 flex items-start gap-4 bg-card animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-muted rounded-lg" />
        <div className="h-3 w-2/3 bg-muted rounded-lg" />
        <div className="h-3 w-1/4 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export default function NotificationsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Notification | null>(null);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const { data: raw = [], isLoading, isError, error } = useQuery<unknown>({
    queryKey: ["notifications"],
    queryFn: () => get<unknown>("/notifications"),
    enabled: !!user,
  });
  const notifications = useMemo(() => unwrapArray<Notification>(raw), [raw]);

  const filtered = useMemo(() => {
    if(filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onMutate: async (id) => optimisticUpdate(queryClient, ["notifications"], id, { isRead: true, readAt: new Date().toISOString() }),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["notifications"], context);
      addToast(extractApiError(err, "Failed to mark as read"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onSuccess: () => {
      addToast("Marked as read", "success");
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onMutate: async () => {
      const previous = queryClient.getQueryData<Notification[]>(["notifications"]) || [];
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        (old || []).map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      return { previous };
    },
    onError: (err, _, context) => {
      rollbackOnError(queryClient, ["notifications"], context);
      addToast(extractApiError(err, "Failed to mark all as read"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onSuccess: () => {
      addToast("All notifications marked as read", "success");
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onMutate: async (id) => optimisticDelete(queryClient, ["notifications"], id),
    onError: (err, id, context) => {
      rollbackOnError(queryClient, ["notifications"], context);
      addToast(extractApiError(err, "Failed to delete notification"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onSuccess: () => {
      addToast("Notification deleted", "success");
    },
  });

  const handleOpen = (n: Notification) => {
    setSelected(n);
    if(!n.isRead){
      markRead.mutate(n.id);
    }
  };

  const handleClose = () => setSelected(null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Stay updated on your finances</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-60"
          >
            {markAllRead.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Mark all read
          </button>
        )}
      </header>

      <div className="flex rounded-xl p-1 w-fit bg-card border border-border">
        {(["all", "unread"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              filter === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sky-500/[0.03]"
            )}
          >
            {tab === "all" ? "All" : "Unread"}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!isLoading && isError && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-center">
            <p className="text-sm text-rose-400 font-medium">Failed to load notifications.</p>
            <p className="text-xs text-muted-foreground mt-1">{extractApiError(error, "Please try again.")}</p>
          </div>
        )}

        {!isLoading && !isError && (
          <AnimatePresence>
            {filtered.map((n, i) => {
              const meta = getTypeMeta(n.type);
              const TypeIcon = meta.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-xl border p-4 flex items-start gap-3 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                    n.isRead ? "border-border bg-card hover:border-white/10" : "border-primary/20 bg-primary/5 hover:bg-primary/[0.08] hover:border-primary/30"
                  )}
                  onClick={() => handleOpen(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") handleOpen(n); }}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", meta.bg, meta.color)}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-foreground">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                      <span className={cn("hidden sm:inline-flex px-2 py-0.5 rounded-full text-sm font-bold uppercase tracking-wider", meta.bg, meta.color)}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2">{n.message}</p>
                    <p className="text-sm text-muted-foreground mt-2">{safeFormatDate(n.createdAt, "dd MMM yyyy HH:mm")}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending}
                        className="p-2 rounded-xl text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                        aria-label="Mark as read"
                      >
                        {markRead.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification.mutate(n.id)}
                      disabled={deleteNotification.isPending}
                      className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                      aria-label="Delete notification"
                    >
                      {deleteNotification.isPending && deleteNotification.variables === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            image="/empty-notifications.png"
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            description="Notifications about bills, budgets, and goals will appear here."
          />
        )}
      </div>

      <Modal isOpen={!!selected} onClose={handleClose} title={selected?.title || "Notification"}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {(() => {
                const meta = getTypeMeta(selected.type);
                const Icon = meta.icon;
                return (
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", meta.bg, meta.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                );
              })()}
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{getTypeMeta(selected.type).label}</p>
                <p className="text-sm text-muted-foreground">{safeFormatDate(selected.createdAt, "dd MMMM yyyy 'at' HH:mm")}</p>
              </div>
            </div>

            <div className="bg-accent/50 rounded-xl p-6">
              <p className="text-base font-medium text-foreground leading-relaxed">{selected.message}</p>
            </div>

          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!notificationToDelete}
        onConfirm={() => {
          if(notificationToDelete){
            deleteNotification.mutate(notificationToDelete);
            setNotificationToDelete(null);
            if(selected?.id === notificationToDelete) handleClose();
          }
        }}
        onCancel={() => setNotificationToDelete(null)}
        title="Delete notification?"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        confirmLabel={deleteNotification.isPending ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
