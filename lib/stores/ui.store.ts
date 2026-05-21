"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FileViewMode, FileSortField, FileSortDirection } from "@/lib/types/file.types";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  fileViewMode: FileViewMode;
  fileSortField: FileSortField;
  fileSortDirection: FileSortDirection;
  detailsPanelOpen: boolean;
  detailsPanelFileId: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setFileViewMode: (mode: FileViewMode) => void;
  setFileSortField: (field: FileSortField) => void;
  setFileSortDirection: (direction: FileSortDirection) => void;
  openDetailsPanel: (fileId: string) => void;
  closeDetailsPanel: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      fileViewMode: "list",
      fileSortField: "name",
      fileSortDirection: "asc",
      detailsPanelOpen: false,
      detailsPanelFileId: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setFileViewMode: (mode) => set({ fileViewMode: mode }),
      setFileSortField: (field) => set({ fileSortField: field }),
      setFileSortDirection: (direction) => set({ fileSortDirection: direction }),
      openDetailsPanel: (fileId) =>
        set({ detailsPanelOpen: true, detailsPanelFileId: fileId }),
      closeDetailsPanel: () =>
        set({ detailsPanelOpen: false, detailsPanelFileId: null }),
    }),
    {
      name: "karsaaz-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        fileViewMode: state.fileViewMode,
        fileSortField: state.fileSortField,
        fileSortDirection: state.fileSortDirection,
      }),
    }
  )
);
