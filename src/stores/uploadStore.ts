/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { create } from "zustand";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export interface UploadJob {
  id: string;
  name: string;
  remotePath: string;
  localUri: string;
  size: number;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface UploadState {
  queue: UploadJob[];
  addJob: (job: Omit<UploadJob, "status" | "progress">) => void;
  updateJob: (id: string, patch: Partial<UploadJob>) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  queue: [],
  addJob: (job) =>
    set((s) => ({
      queue: [...s.queue, { ...job, status: "pending", progress: 0 }],
    })),
  updateJob: (id, patch) =>
    set((s) => ({
      queue: s.queue.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),
  removeJob: (id) =>
    set((s) => ({ queue: s.queue.filter((j) => j.id !== id) })),
  clearCompleted: () =>
    set((s) => ({
      queue: s.queue.filter((j) => j.status !== "done"),
    })),
}));
