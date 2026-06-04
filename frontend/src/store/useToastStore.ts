import { create } from "zustand";
import type { Toast, ToastType } from "@/lib/types";

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = `toast-${++toastIdCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 6000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
