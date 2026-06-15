/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const KEY = "karsaaz_favorites";

interface FavoritesState {
  paths: string[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (path: string) => Promise<void>;
  isFavorite: (path: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  paths: [],
  isHydrated: false,

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    set({ paths: raw ? JSON.parse(raw) : [], isHydrated: true });
  },

  toggle: async (path) => {
    const current = get().paths;
    const next = current.includes(path)
      ? current.filter((p) => p !== path)
      : [...current, path];
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    set({ paths: next });
  },

  isFavorite: (path) => get().paths.includes(path),
}));
