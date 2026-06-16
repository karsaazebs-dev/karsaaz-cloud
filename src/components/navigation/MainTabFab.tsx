/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useSegments, useRouter } from "expo-router";
import { HomeFab } from "@/src/components/home/HomeFab";
import { useUiStore } from "@/src/stores/uiStore";
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";

const FAB_TABS = new Set(["index", "files", "photos"]);

export function MainTabFab() {
  const segments = useSegments();
  const router = useRouter();
  const setShowFabSheet = useUiStore((s) => s.setShowFabSheet);
  const setPendingFabSheet = useUiStore((s) => s.setPendingFabSheet);

  const tabSegment = segments[0] === "(tabs)" ? segments[1] : undefined;
  if (!tabSegment || !FAB_TABS.has(tabSegment)) return null;

  const openCreate = () => {
    // #region agent log
    phase1DebugLog("MainTabFab.tsx:openCreate", "FAB pressed", { tabSegment }, "D");
    // #endregion

    if (tabSegment === "files") {
      setShowFabSheet(true);
      return;
    }
    setPendingFabSheet(true);
    router.push("/(tabs)/files");
  };

  return <HomeFab onPress={openCreate} />;
}
