/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6597 — Not Enough Storage full-screen warning
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotEnoughStorageScreenProps {
  onDismiss?: () => void;
  usedGb?: number;
  totalGb?: number;
  fileSizeGb?: number;
}

export function NotEnoughStorageScreen({
  onDismiss,
  usedGb = 498,
  totalGb = 500,
  fileSizeGb = 5,
}: NotEnoughStorageScreenProps) {
  const router = useRouter();

  const usedPct = Math.min((usedGb / totalGb) * 100, 100);
  const remainingGb = totalGb - usedGb;

  const handleRequestStorage = () => {
    onDismiss?.();
    router.push("/request-storage" as any);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        {/* Orange warning badge */}
        <View style={styles.iconBadge}>
          <Ionicons name="warning" size={36} color="#ffffff" />
        </View>

        <Text style={styles.title}>Not Enough Storage</Text>
        <Text style={styles.subtitle}>
          You don't have enough available storage to upload this file.
        </Text>

        {/* Current Usage card */}
        <View style={styles.usageCard}>
          <Text style={styles.usageCardLabel}>Current Usage</Text>
          <View style={styles.usageRow}>
            <Text style={styles.usageValue}>{usedGb} GB</Text>
            <Text style={styles.usageTotal}>of {totalGb} GB</Text>
          </View>
          <View style={styles.usageBar}>
            <View style={[styles.usageBarFill, { width: `${usedPct}%` as any }]} />
          </View>
          <Text style={styles.almostFull}>
            Almost full — only {remainingGb} GB remaining
          </Text>
        </View>

        {/* Selected file card */}
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-text" size={22} color="#ffffff" />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileLabel}>Selected file</Text>
            <Text style={styles.fileSize}>{fileSizeGb} GB</Text>
            <Text style={styles.fileError}>Cannot upload — exceeds available space</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.requestBtn} onPress={handleRequestStorage}>
          <Text style={styles.requestBtnText}>Request Storage</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text style={styles.cancelLink}>Cancel Upload</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 20,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#09090b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#71717b",
    textAlign: "center",
    lineHeight: 20,
  },

  // Current Usage card
  usageCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  usageCardLabel: { fontSize: 12, color: "#71717b" },
  usageRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  usageValue: { fontSize: 28, fontWeight: "700", color: "#09090b" },
  usageTotal: { fontSize: 13, color: "#71717b" },
  usageBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
  },
  usageBarFill: {
    height: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  almostFull: { fontSize: 12, color: "#ef4444", fontWeight: "500" },

  // Selected file card
  fileCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 16,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: { flex: 1, gap: 2 },
  fileLabel: { fontSize: 12, color: "#71717b" },
  fileSize: { fontSize: 15, fontWeight: "700", color: "#09090b" },
  fileError: { fontSize: 12, color: "#71717b" },

  // Actions
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 14,
    alignItems: "center",
  },
  requestBtn: {
    width: "100%",
    backgroundColor: "#4e3cf4",
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  requestBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  cancelLink: { fontSize: 15, color: "#09090b" },
});
