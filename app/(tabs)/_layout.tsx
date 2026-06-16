/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Alert } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { FigmaTabBar } from "@/src/components/ui/FigmaTabBar";
import { AppOverlays } from "@/src/components/navigation/AppOverlays";
import { useUiStore, type BrowseFilter, type DrawerItemId } from "@/src/stores/uiStore";
import { debugLog } from "@/src/utils/debugLog";

export default function TabLayout() {
  const router = useRouter();
  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);
  const setBrowsePath = useUiStore((s) => s.setBrowsePath);

  const handleDrawerBrowse = (item: DrawerItemId) => {
    const filterMap: Partial<Record<DrawerItemId, BrowseFilter>> = {
      all_files: "all",
      recent_files: "recent",
      personal_files: "personal",
      favorites: "favorites",
    };
    const filter = filterMap[item];
    if (filter) {
      setBrowseFilter(filter);
      setBrowsePath("/");
      if (filter === "favorites") {
        setBrowseMode(false);
        debugLog(
          "tabs/_layout.tsx:drawer",
          "drawer browse → favorites tab",
          { item, filter },
          "A",
          "post-fix"
        );
        router.push("/(tabs)/favorites");
        return;
      }
      if (filter === "all" || filter === "recent") {
        setBrowseMode(false);
        debugLog(
          "tabs/_layout.tsx:drawer",
          "drawer browse → search tab",
          { item, filter },
          "A",
          "post-fix"
        );
        router.push("/(tabs)/shared");
        return;
      }
      setBrowseMode(true);
      debugLog(
        "tabs/_layout.tsx:drawer",
        "drawer browse → home file browser",
        { item, filter },
        "A",
        "post-fix"
      );
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
        <Tabs.Screen name="files" options={{ title: "Home" }} />
        <Tabs.Screen name="shared" options={{ title: "Search" }} />
        <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
        <Tabs.Screen name="photos" options={{ title: "Photos" }} />
        <Tabs.Screen name="settings" options={{ title: "Menu" }} />
        <Tabs.Screen name="activity" options={{ href: null }} />
        <Tabs.Screen name="trash" options={{ href: null }} />
      </Tabs>
      <AppOverlays onDrawerBrowse={handleDrawerBrowse} />
    </>
  );
}
