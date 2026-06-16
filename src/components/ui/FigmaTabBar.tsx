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
  index: { image: figmaAssets.home.homeTab, label: "Home" },
  files: { image: figmaAssets.home.searchTab, label: "Files" },
  photos: { image: figmaAssets.home.galleryTab, label: "Photos" },
  share: { image: figmaAssets.home.favoritesTab, label: "Share" },
};

export function FigmaTabBar({ state, navigation }: FigmaTabBarProps) {
  const insets = useSafeAreaInsets();
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);

  const handlePress = (routeName: string) => {
    if (routeName === "__menu__") {
      setDrawerOpen(true);
      return;
    }
    if (routeName === "index") {
      setBrowseMode(false);
      useUiStore.getState().setBrowsePath("/");
    }
    navigation.navigate(routeName);
  };

  const MENU_ITEM = { key: "__menu__", name: "__menu__" };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        <Image source={figmaAssets.home.tabBarBg} style={styles.tabBarBg} />
        <View style={styles.tabsContainer}>
          {[...state.routes, MENU_ITEM].map((route) => {
            const tab = TAB_CONFIG[route.name] ?? { image: figmaAssets.home.menuTab, label: "Menu" };
            const routeIndex = state.routes.findIndex((r) => r.key === route.key);
            const focused = route.name !== "__menu__" && state.index === routeIndex;

            return (
              <Pressable
                key={route.key}
                onPress={() => handlePress(route.name)}
                style={[styles.item, focused && styles.itemActive]}
              >
                <Image
                  source={tab.image}
                  style={[styles.tabImage, focused && styles.tabImageActive]}
                />
                {focused && <Text style={styles.labelText}>{tab.label}</Text>}
              </Pressable>
            );
          })}
        </View>
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
    justifyContent: "center",
  },
  tabBarBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "stretch",
  },
  tabsContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
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
