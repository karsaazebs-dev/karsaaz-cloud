/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { create } from "zustand";
import type { KarsaazFile } from "@karsaaz/cloud-api";

export type DrawerItemId =
  | "all_files"
  | "recent_files"
  | "personal_files"
  | "favorites"
  | "shared"
  | "activities"
  | "media"
  | "uploads"
  | "on_device"
  | "trashbin"
  | "settings";

export type BrowseFilter = "all" | "recent" | "favorites" | "personal";
export type ViewMode = "list" | "grid";
export type SortOrder = "name-asc" | "name-desc" | "date-desc" | "size-desc";
export type SyncStatus = "connected" | "offline" | "syncing";

interface UiState {
  drawerOpen: boolean;
  activeDrawerItem: DrawerItemId;
  browseFilter: BrowseFilter;
  viewMode: ViewMode;
  sortOrder: SortOrder;
  searchQuery: string;
  syncStatus: SyncStatus;
  actionFile: KarsaazFile | null;
  actionFolder: KarsaazFile | null;
  showCreateFolder: boolean;
  showCreateTag: boolean;
  showAccountSwitcher: boolean;
  showUploadMenu: boolean;
  showNotEnoughStorage: boolean;
  showMoveToFolder: boolean;
  showSwitchServer: boolean;
  browseMode: boolean;
  browsePath: string;
  pendingUploadMenu: boolean;
  showFabSheet: boolean;
  pendingFabSheet: boolean;
  setDrawerOpen: (open: boolean) => void;
  setActiveDrawerItem: (id: DrawerItemId) => void;
  setBrowseFilter: (filter: BrowseFilter) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setActionFile: (file: KarsaazFile | null) => void;
  setActionFolder: (folder: KarsaazFile | null) => void;
  setShowCreateFolder: (show: boolean) => void;
  setShowCreateTag: (show: boolean) => void;
  setShowAccountSwitcher: (show: boolean) => void;
  setShowUploadMenu: (show: boolean) => void;
  setShowNotEnoughStorage: (show: boolean) => void;
  setShowMoveToFolder: (show: boolean) => void;
  setShowSwitchServer: (show: boolean) => void;
  setBrowseMode: (mode: boolean) => void;
  setBrowsePath: (path: string) => void;
  setPendingUploadMenu: (pending: boolean) => void;
  setShowFabSheet: (show: boolean) => void;
  setPendingFabSheet: (pending: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  drawerOpen: false,
  activeDrawerItem: "all_files",
  browseFilter: "all",
  viewMode: "list",
  sortOrder: "name-asc",
  searchQuery: "",
  syncStatus: "connected",
  actionFile: null,
  actionFolder: null,
  showCreateFolder: false,
  showCreateTag: false,
  showAccountSwitcher: false,
  showUploadMenu: false,
  showNotEnoughStorage: false,
  showMoveToFolder: false,
  showSwitchServer: false,
  browseMode: false,
  browsePath: "/",
  pendingUploadMenu: false,
  showFabSheet: false,
  pendingFabSheet: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setActiveDrawerItem: (id) => set({ activeDrawerItem: id }),
  setBrowseFilter: (filter) => set({ browseFilter: filter }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setActionFile: (file) => set({ actionFile: file }),
  setActionFolder: (folder) => set({ actionFolder: folder }),
  setShowCreateFolder: (show) => set({ showCreateFolder: show }),
  setShowCreateTag: (show) => set({ showCreateTag: show }),
  setShowAccountSwitcher: (show) => set({ showAccountSwitcher: show }),
  setShowUploadMenu: (show) => set({ showUploadMenu: show }),
  setShowNotEnoughStorage: (show) => set({ showNotEnoughStorage: show }),
  setShowMoveToFolder: (show) => set({ showMoveToFolder: show }),
  setShowSwitchServer: (show) => set({ showSwitchServer: show }),
  setBrowseMode: (mode) => set({ browseMode: mode }),
  setBrowsePath: (path) => set({ browsePath: path }),
  setPendingUploadMenu: (pending) => set({ pendingUploadMenu: pending }),
  setShowFabSheet: (show) => set({ showFabSheet: show }),
  setPendingFabSheet: (pending) => set({ pendingFabSheet: pending }),
}));
