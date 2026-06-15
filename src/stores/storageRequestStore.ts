/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export interface StorageRequest {
  id: string;
  date: string;
  currentSize: string;
  requestedSize: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface StorageRequestState {
  requests: StorageRequest[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addRequest: (params: {
    currentSize: string;
    requestedSize: string;
    reason: string;
  }) => Promise<void>;
}

const STORAGE_KEY = "karsaaz_storage_requests";

export const useStorageRequestStore = create<StorageRequestState>((set, get) => ({
  requests: [
    {
      id: "req-1",
      date: "2026-05-10T14:32:00Z",
      currentSize: "100 GB",
      requestedSize: "500 GB",
      reason: "Initial allocation upgrade for company backup.",
      status: "Approved",
    },
  ],
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        set({ requests: JSON.parse(raw), isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  addRequest: async ({ currentSize, requestedSize, reason }) => {
    const newRequest: StorageRequest = {
      id: `req-${Date.now()}`,
      date: new Date().toISOString(),
      currentSize,
      requestedSize,
      reason,
      status: "Pending",
    };
    const updated = [newRequest, ...get().requests];
    set({ requests: updated });
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
  },
}));
