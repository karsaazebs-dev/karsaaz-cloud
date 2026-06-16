/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6500 — Request Storage step 3: review summary
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStorageRequestStore } from "@/src/stores/storageRequestStore";
import { useUserQuota } from "@/src/hooks/useUserQuota";

export default function RequestStorageReviewScreen() {
  const router = useRouter();
  const { amount, reason } = useLocalSearchParams<{ amount: string; reason: string }>();
  const addRequest = useStorageRequestStore((s) => s.addRequest);
  const { data: userQuota } = useUserQuota();
  const [loading, setLoading] = useState(false);

  const totalBytes = (userQuota as any)?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const currentGb = Math.round(totalBytes / (1024 * 1024 * 1024));
  const requestedGb = parseInt(amount ?? "0") || 0;
  const newTotalGb = currentGb + requestedGb;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addRequest({
        currentSize: `${currentGb} GB`,
        requestedSize: `${newTotalGb} GB`,
        reason: reason ?? "",
      });
      router.replace("/request-storage-confirm" as any);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Review Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepBar}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.step, n <= 3 && styles.stepActive]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Step 3 of 3</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Review your request</Text>
        <Text style={styles.subtitle}>Confirm the details before submitting to your admin.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Requested amount</Text>
            <Text style={styles.rowValueBlue}>+{requestedGb} GB</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current storage</Text>
            <Text style={styles.rowValue}>{currentGb} GB</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total after approval</Text>
            <Text style={styles.rowValueGreen}>{newTotalGb} GB</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.reasonRow}>
            <Text style={styles.rowLabel}>Reason</Text>
            <Text style={styles.reasonText}>{reason || "—"}</Text>
          </View>
        </View>

        <View style={styles.noticeBadge}>
          <Ionicons name="information-circle-outline" size={16} color="#4e3cf4" />
          <Text style={styles.noticeText}>
            Your admin will review this request and notify you once a decision is made.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitBtn, loading && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Request</Text>
          )}
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "500", color: "#09090b" },
  stepBar: { flexDirection: "row", gap: 6, marginHorizontal: 24, marginTop: 8 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#e4e4e7" },
  stepActive: { backgroundColor: "#4e3cf4" },
  stepLabel: { fontSize: 12, fontWeight: "600", color: "#71717b", marginHorizontal: 24, marginTop: 6 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#09090b" },
  subtitle: { fontSize: 14, color: "#71717b", lineHeight: 20 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reasonRow: { gap: 6 },
  rowLabel: { fontSize: 13, color: "#71717b" },
  rowValue: { fontSize: 14, fontWeight: "600", color: "#09090b" },
  rowValueBlue: { fontSize: 14, fontWeight: "700", color: "#2b7fff" },
  rowValueGreen: { fontSize: 14, fontWeight: "700", color: "#10b981" },
  reasonText: { fontSize: 14, color: "#09090b", lineHeight: 20 },
  divider: { height: 0.5, backgroundColor: "#dfe1e4" },
  noticeBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f0effe",
    borderRadius: 12,
    padding: 14,
  },
  noticeText: { flex: 1, fontSize: 13, color: "#4e3cf4", lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  submitBtn: {
    backgroundColor: "#4e3cf4",
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4e3cf4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelBtnText: { color: "#71717b", fontSize: 14, fontWeight: "500" },
  disabled: { opacity: 0.5 },
});
