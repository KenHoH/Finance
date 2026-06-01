"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import type { ToastType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-sky-400" />,
  error: <XCircle className="w-5 h-5 text-rose-400" />,
  info: <Info className="w-5 h-5 text-sky-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
};

const STYLES: Record<ToastType, string> = {
  success: "border-sky-500/40 bg-sky-950/95 shadow-[0_0_24px_rgba(14,165,233,0.2)]",
  error: "border-rose-500/40 bg-rose-950/95 shadow-[0_0_24px_rgba(244,63,94,0.2)]",
  info: "border-sky-500/40 bg-slate-900/95 shadow-[0_0_24px_rgba(14,165,233,0.15)]",
  warning: "border-amber-500/40 bg-amber-950/95 shadow-[0_0_24px_rgba(245,158,11,0.2)]",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 28 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-4 backdrop-blur-xl",
              STYLES[toast.type]
            )}
          >
            <div className="shrink-0">{ICONS[toast.type]}</div>
            <p className="flex-1 text-sm font-semibold text-foreground leading-relaxed">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
