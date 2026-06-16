/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Alert } from "react-native";
import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
// share tab added in Phase 6 after app/share.tsx is built
import { FigmaTabBar } from "@/src/components/ui/FigmaTabBar";
import { AppOverlays } from "@/src/components/navigation/AppOverlays";
import { MainTabFab } from "@/src/components/navigation/MainTabFab";
import { useUiStore, type BrowseFilter, type DrawerItemId } from "@/src/stores/uiStore";
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";

export default function TabLayout() {
  const router = useRouter();

  // #region agent log
  useEffect(() => {
    phase1DebugLog("app/(tabs)/_layout.tsx:mount", "tab shell mounted", { phase: "phase1-verify" }, "BOOT");
  }, []);
  // #endregion

  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);
  const setBrowsePath = useUiStore((s) => s.setBrowsePath);

  const handleDrawerBrowse = (item: DrawerItemId) => {
    const filterMap: Partial<Record<DrawerItemId, BrowseFilter>> = {
      all_files: "all",
      recent_files: "recent",
      personal_files: "personal",
    };
    const filter = filterMap[item];
    if (filter) {
      setBrowseFilter(filter);
      setBrowsePath("/");
      setBrowseMode(filter !== "all" && filter !== "recent");
      router.push("/(tabs)/files");
      return;
    }
    if (item === "uploads") {
      Alert.alert("Uploads", "Upload queue is managed by background sync.");
    }
    if (item === "on_device") {
      Alert.alert("On device", "Pinned local files will be available in a future update.");
    }
  };

  return (
    <>
      <Tabs
        tabBar={(props) => <FigmaTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: "relative", backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="files" options={{ title: "Files" }} />
        <Tabs.Screen name="photos" options={{ title: "Photos" }} />
        <Tabs.Screen name="share" options={{ title: "Share", href: null }} />
      </Tabs>
      <MainTabFab />
      <AppOverlays onDrawerBrowse={handleDrawerBrowse} />
    </>
  );
}
