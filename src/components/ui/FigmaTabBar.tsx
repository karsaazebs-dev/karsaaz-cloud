/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 283:454 — bottom tab bar
 */

import { View, Pressable, StyleSheet, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { figmaAssets } from "@/src/constants/assets";
import { useUiStore } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

interface TabRoute {
  key: string;
  name: string;
}

interface FigmaTabBarProps {
  state: { routes: TabRoute[]; index: number };
  navigation: { navigate: (name: string) => void };
}

const TAB_CONFIG: Record<
  string,
  { image?: number; icon?: keyof typeof Ionicons.glyphMap; iconActive?: keyof typeof Ionicons.glyphMap }
> = {
  files: { image: figmaAssets.home.homeTab },
  shared: { image: figmaAssets.home.searchTab },
  photos: { image: figmaAssets.home.galleryTab },
  favorites: { icon: "heart-outline", iconActive: "heart" },
  settings: { image: figmaAssets.home.menuTab },
};

export function FigmaTabBar({ state, navigation }: FigmaTabBarProps) {
  const insets = useSafeAreaInsets();
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);

  const handlePress = (routeName: string) => {
    if (routeName === "settings") {
      setDrawerOpen(true);
      return;
    }
    if (routeName === "files") {
      setBrowseMode(false);
      useUiStore.getState().setBrowsePath("/");
    }
    navigation.navigate(routeName);
  };

  const visibleRoutes = state.routes.filter(
    (route) => !["trash", "activity"].includes(route.name)
  );

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const tab = TAB_CONFIG[route.name] ?? TAB_CONFIG.files;
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === routeIndex;
          const isMenu = route.name === "settings";
          const active = focused && !isMenu;
          const showHomeLabel = active && route.name === "files";

          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(route.name)}
              style={[styles.item, active && styles.itemActive, showHomeLabel && styles.itemHome]}
            >
              {tab.image ? (
                <Image
                  source={tab.image}
                  style={[styles.tabImage, !active && styles.tabImageInactive]}
                />
              ) : (
                <Ionicons
                  name={active ? (tab.iconActive ?? tab.icon ?? "ellipse") : (tab.icon ?? "ellipse-outline")}
                  size={22}
                  color={active ? theme.colors.tabBar : theme.colors.tabBarInactive}
                />
              )}
              {showHomeLabel && <Text style={styles.homeLabel}>Home</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    backgroundColor: theme.colors.tabBar,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.04,
    shadowRadius: 28,
    elevation: 6,
  },
  item: {
    minWidth: 52,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 6,
  },
  itemActive: {
    backgroundColor: theme.colors.tabBarActive,
  },
  itemHome: {
    paddingHorizontal: 16,
  },
  homeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.tabBar,
  },
  tabImage: { width: 22, height: 22, resizeMode: "contain" },
  tabImageInactive: { opacity: 0.55 },
});
