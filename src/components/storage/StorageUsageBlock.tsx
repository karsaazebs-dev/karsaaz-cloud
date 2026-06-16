/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 1:6667, 1:1625 — storage bar + legend
 */

import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";
import { formatFileSize } from "@/src/utils/fileFilters";

interface StorageUsageBlockProps {
  usedBytes: number;
  totalBytes: number;
  usedLabel?: string;
}

export function StorageUsageBlock({
  usedBytes,
  totalBytes,
  usedLabel = "Used",
}: StorageUsageBlockProps) {
  const isUnlimited = totalBytes < 0;
  const usedGb = usedBytes / (1024 * 1024 * 1024);
  const totalGb = isUnlimited ? 0 : totalBytes / (1024 * 1024 * 1024);
  const usedPct = isUnlimited ? 0 : Math.min(Math.max((usedBytes / totalBytes) * 100, 0), 100);
  const imgWeight = Math.max(usedPct * 0.4, 0.05);
  const docWeight = Math.max(usedPct * 0.3, 0.05);
  const vidWeight = Math.max(usedPct * 0.2, 0.05);
  const othWeight = Math.max(usedPct * 0.1, 0.05);
  const emptyWeight = Math.max(100 - usedPct, 0.05);

  const usedDisplay =
    !isUnlimited && totalGb >= 1
      ? `${Math.round(usedGb)} GB`
      : formatFileSize(usedBytes);
  const totalDisplay = isUnlimited ? "Unlimited" : formatFileSize(totalBytes);

  return (
    <View style={styles.wrap}>
      <Text style={styles.usedLabel}>{usedLabel}</Text>
      <Text style={styles.usedValue}>
        <Text style={styles.usedBold}>{usedDisplay} </Text>
        <Text style={styles.usedMuted}>of {totalDisplay}</Text>
      </Text>
      <View style={styles.storageBar}>
        <View style={[styles.barSeg, { flex: imgWeight, backgroundColor: theme.colors.storageImages }]} />
        <View style={[styles.barSeg, { flex: docWeight, backgroundColor: theme.colors.storageDocs }]} />
        <View style={[styles.barSeg, { flex: vidWeight, backgroundColor: theme.colors.storageVideos }]} />
        <View style={[styles.barSeg, { flex: othWeight, backgroundColor: theme.colors.storageOther }]} />
        {emptyWeight > 0 && (
          <View style={[styles.barSeg, { flex: emptyWeight, backgroundColor: theme.colors.storageEmpty }]} />
        )}
      </View>
      <View style={styles.legend}>
        {[
          ["Images", theme.colors.storageImages],
          ["Documents", theme.colors.storageDocs],
          ["Videos", theme.colors.storageVideos],
          ["Others", theme.colors.storageOther],
        ].map(([label, color]) => (
          <View key={label as string} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color as string }]} />
            <Text style={styles.legendText}>{label as string}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  usedLabel: { fontSize: 18, color: theme.colors.text },
  usedValue: { marginBottom: 4 },
  usedBold: { fontSize: 24, fontWeight: "600", color: theme.colors.text },
  usedMuted: { fontSize: 18, color: theme.colors.textMuted },
  storageBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    gap: 2,
  },
  barSeg: { borderRadius: 2 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: theme.colors.text },
});
