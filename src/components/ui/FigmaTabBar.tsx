/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 18:136 — bottom tab bar (dark bg, white active pill)
 */

import { useEffect } from "react";
import { View, Pressable, StyleSheet, Image, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { figmaAssets } from "@/src/constants/assets";
import { useUiStore } from "@/src/stores/uiStore";
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";

interface TabRoute {
  key: string;
  name: string;
}

interface FigmaTabBarProps {
  state: { routes: TabRoute[]; index: number };
  navigation: { navigate: (name: string) => void };
}

type FigmaSlotId = "home" | "search" | "favorites" | "gallery" | "menu";

const FIGMA_SLOTS: {
  id: FigmaSlotId;
  image: number;
  label: string;
  route?: string;
}[] = [
  { id: "home", image: figmaAssets.home.homeTab, label: "Home", route: "index" },
  { id: "search", image: figmaAssets.home.searchTab, label: "Search", route: "files" },
  { id: "favorites", image: figmaAssets.home.favoritesTab, label: "Favorites", route: "files" },
  { id: "gallery", image: figmaAssets.home.galleryTab, label: "Photos", route: "photos" },
  { id: "menu", image: figmaAssets.home.menuTab, label: "Menu" },
];

export function FigmaTabBar({ state, navigation }: FigmaTabBarProps) {
  const insets = useSafeAreaInsets();
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);
  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setBrowsePath = useUiStore((s) => s.setBrowsePath);
  const browseFilter = useUiStore((s) => s.browseFilter);

  const activeRoute = state.routes[state.index]?.name ?? "index";

  const isSlotFocused = (slot: FigmaSlotId): boolean => {
    if (slot === "home") return activeRoute === "index";
    if (slot === "gallery") return activeRoute === "photos";
    if (slot === "search") return activeRoute === "files" && browseFilter !== "favorites";
    if (slot === "favorites") return activeRoute === "files" && browseFilter === "favorites";
    return false;
  };

  // #region agent log
  useEffect(() => {
    phase1DebugLog("FigmaTabBar.tsx:mount", "tab bar render state", {
      activeRoute,
      browseFilter,
      slotCount: FIGMA_SLOTS.length,
      focusedSlots: FIGMA_SLOTS.filter((s) => isSlotFocused(s.id)).map((s) => s.id),
    }, "A");
  }, [activeRoute, browseFilter]);
  // #endregion

  const handlePress = (slot: (typeof FIGMA_SLOTS)[number]) => {
    if (slot.id === "menu") {
      setDrawerOpen(true);
      return;
    }
    if (slot.id === "home") {
      setBrowseMode(false);
      setBrowsePath("/");
      navigation.navigate("index");
      return;
    }
    if (slot.id === "search") {
      setBrowseFilter("all");
      setBrowsePath("/");
      setBrowseMode(true);
      navigation.navigate("files");
      return;
    }
    if (slot.id === "favorites") {
      setBrowseFilter("favorites");
      setBrowsePath("/");
      setBrowseMode(true);
      navigation.navigate("files");
      return;
    }
    if (slot.route) {
      navigation.navigate(slot.route);
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {FIGMA_SLOTS.map((slot) => {
          const focused = isSlotFocused(slot.id);

          return (
            <Pressable
              key={slot.id}
              onPress={() => handlePress(slot)}
              style={styles.item}
              accessibilityRole="button"
              accessibilityLabel={slot.label}
            >
              <View style={[styles.pill, focused && styles.pillActive]}>
                <Image
                  source={slot.image}
                  style={[styles.tabImage, focused ? styles.tabImageActive : styles.tabImageInactive]}
                  onLoad={() => {
                    // #region agent log
                    phase1DebugLog(
                      "FigmaTabBar.tsx:iconLoad",
                      "tab icon loaded",
                      { slotId: slot.id, focused },
                      "F"
                    );
                    // #endregion
                  }}
                />
                {focused && <Text style={styles.labelText}>{slot.label}</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#1d1f2b",
  },
  bar: {
    flexDirection: "row",
    height: 68,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  // Touch target — always equal width, centers its pill content
  item: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  // Visual pill — natural width, wraps icon + label
  pill: {
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  pillActive: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "400",
    color: "#09090b",
  },
  tabImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  tabImageActive: {
    tintColor: "#09090b",
  },
  tabImageInactive: {
    tintColor: "#9ca3af",
  },
});
