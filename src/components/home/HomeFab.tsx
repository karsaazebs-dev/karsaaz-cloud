/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 283:454 — FAB
 */

import { Pressable, StyleSheet, Image, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

const TAB_BAR_CLEARANCE = 88;

interface HomeFabProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function HomeFab({ onPress, style }: HomeFabProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.fab, { bottom: insets.bottom + TAB_BAR_CLEARANCE }, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Upload or create"
    >
      <Image source={figmaAssets.home.fabPlus} style={styles.fabImage} />
    </Pressable>
  );
}

export { HomeFab as FigmaFab };

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 24,
    width: 65,
    height: 65,
    zIndex: 20,
    ...theme.shadow.button,
  },
  fabImage: {
    width: 65,
    height: 65,
    resizeMode: "contain",
  },
});
