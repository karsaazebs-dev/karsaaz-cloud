/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const KEY = "karsaaz_tags";

interface TagsState {
  tags: string[];
  fileTags: Record<string, string[]>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addTag: (name: string) => Promise<void>;
  assignTag: (filePath: string, tag: string) => Promise<void>;
  unassignTag: (filePath: string, tag: string) => Promise<void>;
  getTagsForFile: (filePath: string) => string[];
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  fileTags: {},
  isHydrated: false,

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) {
      set({ isHydrated: true });
      return;
    }
    const parsed = JSON.parse(raw) as { tags: string[]; fileTags: Record<string, string[]> };
    set({ tags: parsed.tags ?? [], fileTags: parsed.fileTags ?? {}, isHydrated: true });
  },

  addTag: async (name) => {
    const trimmed = name.trim();
    if (!trimmed || get().tags.includes(trimmed)) return;
    const tags = [...get().tags, trimmed];
    await SecureStore.setItemAsync(KEY, JSON.stringify({ tags, fileTags: get().fileTags }));
    set({ tags });
  },

  assignTag: async (filePath, tag) => {
    const current = get().fileTags[filePath] ?? [];
    if (current.includes(tag)) return;
    const fileTags = { ...get().fileTags, [filePath]: [...current, tag] };
    await SecureStore.setItemAsync(KEY, JSON.stringify({ tags: get().tags, fileTags }));
    set({ fileTags });
  },

  unassignTag: async (filePath, tag) => {
    const current = get().fileTags[filePath] ?? [];
    if (!current.includes(tag)) return;
    const fileTags = { ...get().fileTags, [filePath]: current.filter((t) => t !== tag) };
    await SecureStore.setItemAsync(KEY, JSON.stringify({ tags: get().tags, fileTags }));
    set({ fileTags });
  },

  getTagsForFile: (filePath) => get().fileTags[filePath] ?? [],
}));
