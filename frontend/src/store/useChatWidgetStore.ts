import { create } from "zustand";

interface ChatWidgetState {
  isOpen: boolean;
  isExpanded: boolean;
  setIsOpen: (v: boolean) => void;
  setIsExpanded: (v: boolean) => void;
  toggle: () => void;
}

export const useChatWidgetStore = create<ChatWidgetState>()((set) => ({
  isOpen: false,
  isExpanded: false,
  setIsOpen: (v) => set({ isOpen: v }),
  setIsExpanded: (v) => set({ isExpanded: v }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
