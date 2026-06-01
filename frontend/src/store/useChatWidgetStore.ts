import { create } from "zustand";

interface ChatWidgetState {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  toggle: () => void;
}

export const useChatWidgetStore = create<ChatWidgetState>()((set) => ({
  isOpen: false,
  setIsOpen: (v) => set({ isOpen: v }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
