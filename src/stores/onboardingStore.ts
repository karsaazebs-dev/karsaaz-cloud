/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const KEY = "karsaaz_onboarding_complete";

interface OnboardingState {
  isHydrated: boolean;
  isComplete: boolean;
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isHydrated: false,
  isComplete: false,

  hydrate: async () => {
    const value = await SecureStore.getItemAsync(KEY);
    set({ isHydrated: true, isComplete: value === "true" });
  },

  complete: async () => {
    await SecureStore.setItemAsync(KEY, "true");
    set({ isComplete: true });
  },

  reset: async () => {
    await SecureStore.deleteItemAsync(KEY);
    set({ isComplete: false });
  },
}));
