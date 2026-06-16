/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6402 — Request Status list (backed by karsaaz_quota API)
 */

import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuotaRequests } from "@/src/hooks/useQuotaAllocation";
import type { QuotaRequest } from "@/src/api/quotaAllocation";

function formatGb(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${Math.round(bytes / 1_073_741_824)} GB`;
  if (bytes >= 1_048_576)     return `${Math.round(bytes / 1_048_576)} MB`;
  return `${bytes} B`;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:  { label: "Pending",  dot: "#ca8a04", text: "#a16207", bg: "#fef9c3" },
  approved: { label: "Approved", dot: "#16a34a", text: "#15803d", bg: "#dcfce7" },
  rejected: { label: "Rejected", dot: "#dc2626", text: "#b91c1c", bg: "#fee2e2" },
};

function RequestItem({ item }: { item: QuotaRequest }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const addedGb = formatGb(Math.max(0, item.requested_bytes - item.current_bytes));
  const date = new Date(item.created_at * 1000).toLocaleDateString(undefined, {
    day: "numeric", month: "short",
  });

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardAmount}>+{addedGb}</Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Quota details */}
      <View style={styles.metaBox}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Current quota</Text>
          <Text style={styles.metaValue}>{formatGb(item.current_bytes)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Requested total</Text>
          <Text style={styles.metaValue}>{formatGb(item.requested_bytes)}</Text>
        </View>
      </View>

      {/* Reason (rejected only) */}
      {item.status === "rejected" && item.reason ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>
            Reason: <Text style={{ color: "#dc2626" }}>{item.reason}</Text>
          </Text>
        </View>
      ) : null}

      {/* Cancel button (pending only — user-facing) */}
      {item.status === "pending" && (
        <Pressable
          style={styles.cancelReqBtn}
          onPress={() => Alert.alert("Cancel", "Cancelling requests is not yet supported.")}
        >
          <Text style={styles.cancelReqText}>Cancel Request</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function RequestStorageHistoryScreen() {
  const router = useRouter();
  const { data: requests = [], isLoading } = useQuotaRequests();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Request Status</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4e3cf4" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RequestItem item={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={40} color="#d4d4d8" />
              <Text style={styles.emptyText}>No requests yet</Text>
            </View>
          }
        />
      )}

      {/* Back to home */}
      <View style={styles.footer}>
        <Pressable style={styles.homeBtn} onPress={() => router.replace("/(tabs)" as any)}>
          <Text style={styles.homeBtnText}>Back to home</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dfe1e4",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#09090b" },
  loader: { marginTop: 60 },
  list: { padding: 20, gap: 14, paddingBottom: 100 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardAmount: { fontSize: 26, fontWeight: "700", color: "#09090b" },
  cardDate: { fontSize: 12, color: "#71717b", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },

  metaBox: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 13, color: "#71717b" },
  metaValue: { fontSize: 13, fontWeight: "600", color: "#09090b" },

  reasonBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
  },
  reasonText: { fontSize: 13, color: "#71717b" },

  cancelReqBtn: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelReqText: { fontSize: 14, fontWeight: "600", color: "#dc2626" },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: "#71717b" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: "#f7f7f7",
  },
  homeBtn: {
    backgroundColor: "#4e3cf4",
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  homeBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
