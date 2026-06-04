import { create } from "zustand";
import { api, setCsrfToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  fetchUser: async() => {
    try{
      const { data } = await api.get("/auth/me");
      set({ user: data.user ?? null, isLoading: false });
    } catch{
      set({ user: null, isLoading: false });
    }
  },
  logout: async() => {
    try{
      await api.post("/auth/logout");
    } catch{
      // ignore — server route clears cookies regardless
    }
    document.cookie = "csrf-token=; path=/; max-age=0; SameSite=Lax";
    setCsrfToken("");
    set({ user: null, isLoading: false });
    if(typeof window !== "undefined"){
      window.location.href = "/login";
    }
  },
  setUser: (user) => set({ user }),
}));
