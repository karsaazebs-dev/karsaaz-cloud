/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import {
  listSystemTags,
  createSystemTag,
  getFileSystemTags,
  assignSystemTag,
  unassignSystemTag,
  type SystemTag,
} from "@karsaaz/cloud-api";
import { useAuthStore } from "./authStore";

const KEY = "karsaaz_tags";

export interface TagEntry {
  id: number;
  name: string;
  color: string;
}

function tagKey(tag: TagEntry): string {
  return `${tag.id}::${tag.name}::${tag.color}`;
}

function parseStoredTag(raw: string): TagEntry | null {
  const parts = raw.split("::");
  const id = Number(parts[0]);
  if (!Number.isFinite(id)) {
    const legacy = raw.split("::");
    return { id: -1, name: legacy[0] ?? raw, color: legacy[1] ?? "#3b82f6" };
  }
  return {
    id,
    name: parts[1] ?? raw,
    color: parts[2] ?? "#3b82f6",
  };
}

function serializeTag(tag: TagEntry): string {
  return tagKey(tag);
}

interface TagsState {
  tags: string[];
  fileTags: Record<string, string[]>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  loadFileTags: (fileId: number, filePath: string) => Promise<void>;
  addTag: (name: string, color?: string) => Promise<TagEntry | null>;
  assignTag: (filePath: string, tagKeyStr: string, fileId?: number) => Promise<void>;
  unassignTag: (filePath: string, tagKeyStr: string, fileId?: number) => Promise<void>;
  getTagsForFile: (filePath: string) => string[];
}

async function persist(tags: string[], fileTags: Record<string, string[]>): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify({ tags, fileTags }));
}

function getBasicAuth(): string | null {
  return useAuthStore.getState().basicAuth || null;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  fileTags: {},
  isHydrated: false,

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) {
      set({ isHydrated: true });
      await get().syncFromServer();
      return;
    }
    const parsed = JSON.parse(raw) as { tags: string[]; fileTags: Record<string, string[]> };
    set({ tags: parsed.tags ?? [], fileTags: parsed.fileTags ?? {}, isHydrated: true });
    await get().syncFromServer();
  },

  syncFromServer: async () => {
    const basicAuth = getBasicAuth();
    if (!basicAuth) return;
    try {
      const serverTags = await listSystemTags({ basicAuth });
      const tags = serverTags.map((t) =>
        serializeTag({ id: t.id, name: t.name, color: "#3b82f6" })
      );
      await persist(tags, get().fileTags);
      set({ tags });
    } catch {
      // offline or systemtags app disabled
    }
  },

  loadFileTags: async (fileId, filePath) => {
    const basicAuth = getBasicAuth();
    if (!basicAuth || !fileId) return;
    try {
      const assigned = await getFileSystemTags({ basicAuth }, fileId);
      const keys = assigned.map((t) =>
        serializeTag({ id: t.id, name: t.name, color: "#3b82f6" })
      );
      const fileTags = { ...get().fileTags, [filePath]: keys };
      await persist(get().tags, fileTags);
      set({ fileTags });
    } catch {
      // keep cached assignments
    }
  },

  addTag: async (name, color = "#3b82f6") => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const basicAuth = getBasicAuth();
    let entry: TagEntry = { id: -1, name: trimmed, color };

    if (basicAuth) {
      try {
        const created = await createSystemTag({ basicAuth }, trimmed);
        entry = { id: created.id, name: created.name, color };
      } catch {
        // fall back to local-only tag
      }
    }

    const key = serializeTag(entry);
    if (get().tags.includes(key)) return entry;

    const tags = [...get().tags, key];
    await persist(tags, get().fileTags);
    set({ tags });
    return entry;
  },

  assignTag: async (filePath, tagKeyStr, fileId) => {
    const current = get().fileTags[filePath] ?? [];
    if (current.includes(tagKeyStr)) return;

    const tag = parseStoredTag(tagKeyStr);
    const basicAuth = getBasicAuth();
    if (basicAuth && fileId && tag && tag.id > 0) {
      try {
        await assignSystemTag({ basicAuth }, fileId, tag.id);
      } catch {
        throw new Error("Could not assign tag on server");
      }
    }

    const fileTags = { ...get().fileTags, [filePath]: [...current, tagKeyStr] };
    await persist(get().tags, fileTags);
    set({ fileTags });
  },

  unassignTag: async (filePath, tagKeyStr, fileId) => {
    const current = get().fileTags[filePath] ?? [];
    if (!current.includes(tagKeyStr)) return;

    const tag = parseStoredTag(tagKeyStr);
    const basicAuth = getBasicAuth();
    if (basicAuth && fileId && tag && tag.id > 0) {
      try {
        await unassignSystemTag({ basicAuth }, fileId, tag.id);
      } catch {
        throw new Error("Could not remove tag on server");
      }
    }

    const fileTags = {
      ...get().fileTags,
      [filePath]: current.filter((t) => t !== tagKeyStr),
    };
    await persist(get().tags, fileTags);
    set({ fileTags });
  },

  getTagsForFile: (filePath) => get().fileTags[filePath] ?? [],
}));

export function parseTagDisplay(tagStr: string): { id: number; name: string; color: string } {
  const parsed = parseStoredTag(tagStr);
  return parsed ?? { id: -1, name: tagStr, color: "#3b82f6" };
}
