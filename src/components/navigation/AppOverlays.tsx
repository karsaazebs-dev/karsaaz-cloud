/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DrawerMenu } from "@/src/components/navigation/DrawerMenu";
import { AccountSwitcherModal } from "@/src/components/account/AccountSwitcherModal";
import { CreateTagModal } from "@/src/components/files/CreateTagModal";
import { useUiStore, type DrawerItemId } from "@/src/stores/uiStore";

interface AppOverlaysProps {
  onDrawerBrowse: (item: DrawerItemId) => void;
}

export function AppOverlays({ onDrawerBrowse }: AppOverlaysProps) {
  return (
    <>
      <DrawerMenu onBrowse={onDrawerBrowse} />
      <AccountSwitcherModal />
      <CreateTagModal />
    </>
  );
}

export function useDrawerBrowseHandler() {
  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);

  return (item: DrawerItemId) => {
    const map: Partial<Record<DrawerItemId, "all" | "recent" | "favorites" | "personal">> = {
      all_files: "all",
      recent_files: "recent",
      personal_files: "personal",
      favorites: "favorites",
    };
    const filter = map[item];
    if (filter) {
      setBrowseFilter(filter);
      setBrowseMode(true);
    }
  };
}
