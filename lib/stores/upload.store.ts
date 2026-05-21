"use client";

import { create } from "zustand";
import type { FileUpload } from "@/lib/types/file.types";

interface UploadState {
  uploads: FileUpload[];
  panelOpen: boolean;

  addUpload: (upload: FileUpload) => void;
  updateUpload: (id: string, partial: Partial<FileUpload>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  uploads: [],
  panelOpen: false,

  addUpload(upload) {
    set((s) => ({ uploads: [...s.uploads, upload], panelOpen: true }));
  },

  updateUpload(id, partial) {
    set((s) => ({
      uploads: s.uploads.map((u) => (u.id === id ? { ...u, ...partial } : u)),
    }));
  },

  removeUpload(id) {
    set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) }));
  },

  clearCompleted() {
    set((s) => ({
      uploads: s.uploads.filter(
        (u) => u.status !== "done" && u.status !== "error"
      ),
    }));
  },

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
}));
