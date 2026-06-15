/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore, type SyncStatus } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

const STATUS_CONFIG: Record<
  SyncStatus,
  { label: string; dotColor?: string; icon?: keyof typeof Ionicons.glyphMap }
> = {
  connected: { label: "Connected", dotColor: "#22c55e" },
  offline: { label: "Offline", dotColor: "#dc2626" },
  syncing: { label: "Syncing", icon: "sync-outline" },
};

export function ConnectionStatus() {
  const status = useUiStore((s) => s.syncStatus);
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.wrap}>
      {config.icon ? (
        <Ionicons name={config.icon} size={14} color={theme.colors.text} />
      ) : (
        <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      )}
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 12, color: theme.colors.text },
});
