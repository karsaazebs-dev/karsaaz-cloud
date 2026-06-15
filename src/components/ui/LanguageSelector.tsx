/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

export function LanguageSelector() {
  return (
    <View style={styles.wrap}>
      <Image source={figmaAssets.onboarding.ukFlag} style={styles.flag} />
      <Text style={styles.label}>ENG</Text>
      <Ionicons name="chevron-down" size={14} color="#333" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 0.8,
    borderColor: "rgba(0,0,0,0.09)",
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 33,
  },
  flag: { width: 18, height: 14 },
  label: { fontSize: 10.6, fontWeight: "600", color: "#333" },
});
