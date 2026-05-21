"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { KarsaazUser, UserQuota } from "@/lib/types/user.types";

interface AuthState {
  user: KarsaazUser | null;
  basicAuth: string | null;
  isLoading: boolean;
  setUser: (user: KarsaazUser, basicAuth: string) => void;
  updateQuota: (quota: UserQuota) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      basicAuth: null,
      isLoading: false,

      setUser(user, basicAuth) {
        set({ user, basicAuth, isLoading: false });
      },

      updateQuota(quota) {
        set((state) => ({
          user: state.user ? { ...state.user, quota } : null,
        }));
      },

      clear() {
        set({ user: null, basicAuth: null, isLoading: false });
      },
    }),
    {
      name: "karsaaz-auth",
      partialize: (state) => ({
        user: state.user,
        basicAuth: state.basicAuth,
      }),
    }
  )
);
