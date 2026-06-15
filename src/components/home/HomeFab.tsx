/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 283:454 — FAB
 */

import { Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

const TAB_BAR_CLEARANCE = 92;

interface HomeFabProps {
  onPress: () => void;
}

export function HomeFab({ onPress }: HomeFabProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.fab, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Upload or create"
    >
      <Image source={figmaAssets.home.fabPlus} style={styles.fabIcon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accentBright,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    ...theme.shadow.button,
  },
  fabIcon: { width: 24, height: 24, resizeMode: "contain", tintColor: "#ffffff" },
});
