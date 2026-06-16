/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6402 — Request Storage history list
 */

import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStorageRequestStore, type StorageRequest } from "@/src/stores/storageRequestStore";

const STATUS_CONFIG: Record<
  StorageRequest["status"],
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Pending:  { label: "Pending",  color: "#a16207", bg: "rgba(234,179,8,0.1)",  icon: "time-outline" },
  Approved: { label: "Approved", color: "#15803d", bg: "rgba(22,163,74,0.1)",  icon: "checkmark-circle-outline" },
  Rejected: { label: "Rejected", color: "#b91c1c", bg: "rgba(220,38,38,0.1)",  icon: "close-circle-outline" },
};

function RequestItem({ item }: { item: StorageRequest }) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>+{
            (() => {
              const cur = parseInt(item.currentSize);
              const req = parseInt(item.requestedSize);
              return isNaN(cur) || isNaN(req) ? item.requestedSize : `${req - cur} GB`;
            })()
          }</Text>
          <Text style={styles.cardDate}>
            {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaLabel}>From</Text>
        <Text style={styles.metaValue}>{item.currentSize}</Text>
        <Ionicons name="arrow-forward" size={12} color="#71717b" />
        <Text style={styles.metaValue}>{item.requestedSize}</Text>
      </View>
      {item.reason ? (
        <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
      ) : null}
    </View>
  );
}

export default function RequestStorageHistoryScreen() {
  const router = useRouter();
  const requests = useStorageRequestStore((s) => s.requests);
  const hydrate = useStorageRequestStore((s) => s.hydrate);

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Request History</Text>
        <View style={{ width: 40 }} />
      </View>

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
  list: { padding: 24, gap: 12 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardLeft: { gap: 2 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#09090b" },
  cardDate: { fontSize: 12, color: "#71717b" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaLabel: { fontSize: 12, color: "#71717b" },
  metaValue: { fontSize: 13, fontWeight: "600", color: "#09090b" },
  reason: { fontSize: 13, color: "#71717b", lineHeight: 18 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: "#71717b" },
});
