/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:995 — bottom tab bar (Home / Search / Favorites / Photos / Menu)
 */

import { View, Pressable, StyleSheet, Image, Text } from "react-native";
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

const TAB_CONFIG: Record<string, { image: number; label: string }> = {
  files: { image: figmaAssets.home.homeTab, label: "Home" },
  shared: { image: figmaAssets.home.searchTab, label: "Search" },
  favorites: { image: figmaAssets.home.favoritesTab, label: "Favorites" },
  photos: { image: figmaAssets.home.galleryTab, label: "Photos" },
  settings: { image: figmaAssets.home.menuTab, label: "Menu" },
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

          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(route.name)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Image
                source={tab.image}
                style={[styles.tabImage, active && styles.tabImageActive]}
              />
              {active && <Text style={styles.labelText}>{tab.label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    minHeight: 70,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.tabBar,
  },
  item: {
    minWidth: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 6,
  },
  itemActive: {
    backgroundColor: theme.colors.tabBarActive,
    paddingHorizontal: 14,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "500",
    color: theme.colors.text,
  },
  tabImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    tintColor: "#ffffff",
  },
  tabImageActive: {
    tintColor: theme.colors.text,
  },
});
