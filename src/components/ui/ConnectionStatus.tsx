/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:5612 — Connected / Offline / Syncing
 */

import { View, Text, StyleSheet, Image } from "react-native";
import { useUiStore, type SyncStatus } from "@/src/stores/uiStore";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

const STATUS_CONFIG: Record<
  SyncStatus,
  { label: string; icon: number; tint?: string }
> = {
  connected: { label: "Connected", icon: figmaAssets.status.connectedDot },
  offline: { label: "Offline", icon: figmaAssets.status.offlineDot },
  syncing: { label: "Syncing", icon: figmaAssets.status.syncIcon, tint: theme.colors.text },
};

export function ConnectionStatus() {
  const status = useUiStore((s) => s.syncStatus);
  const config = STATUS_CONFIG[status];
  const isSyncing = status === "syncing";

  return (
    <View style={styles.wrap}>
      <Image
        source={config.icon}
        style={[
          isSyncing ? styles.syncIcon : styles.dotIcon,
          config.tint ? { tintColor: config.tint } : null,
        ]}
      />
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  dotIcon: { width: 10, height: 10, resizeMode: "contain" },
  syncIcon: { width: 18, height: 18, resizeMode: "contain" },
  label: { fontSize: 12, color: theme.colors.text },
});
