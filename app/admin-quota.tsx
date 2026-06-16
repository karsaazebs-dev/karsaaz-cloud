/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Admin screen: view pool, list managed users, adjust their quotas,
 * and approve / reject storage requests.
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  usePool,
  useManagedUsers,
  useAllocateMutation,
  useQuotaRequests,
  useReviewRequestMutation,
} from "@/src/hooks/useQuotaAllocation";
import type { ManagedUser, QuotaRequest } from "@/src/api/quotaAllocation";
import { theme } from "@/src/constants/theme";

type Tab = "pool" | "users" | "requests";

function formatGb(bytes: number): string {
  if (bytes >= 1_099_511_627_776) return `${(bytes / 1_099_511_627_776).toFixed(1)} TB`;
  if (bytes >= 1_073_741_824)     return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576)         return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${bytes} B`;
}

// ── Pool Summary ──────────────────────────────────────────────────────────────

function PoolTab() {
  const { data, isLoading } = usePool();

  if (isLoading) return <ActivityIndicator style={styles.loader} color={theme.colors.accent} />;

  const total       = data?.total_bytes ?? 0;
  const distributed = data?.distributed_bytes ?? 0;
  const available   = data?.available_bytes ?? 0;
  const usedPct     = total > 0 ? (distributed / total) * 100 : 0;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Storage Pool</Text>
        <Text style={styles.poolTotal}>{formatGb(total)}</Text>
        <Text style={styles.cardSub}>Total allocated to you</Text>

        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(usedPct, 100)}%` as any }]} />
        </View>

        <View style={styles.poolStats}>
          <View style={styles.poolStatItem}>
            <Text style={styles.poolStatValue}>{formatGb(distributed)}</Text>
            <Text style={styles.poolStatLabel}>Distributed</Text>
          </View>
          <View style={styles.poolStatItem}>
            <Text style={[styles.poolStatValue, { color: "#16a34a" }]}>{formatGb(available)}</Text>
            <Text style={styles.poolStatLabel}>Available</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: "#f0fdf4" }]}>
        <Ionicons name="information-circle-outline" size={20} color="#16a34a" />
        <Text style={[styles.cardSub, { marginTop: 6 }]}>
          Distribute storage from your available pool to users. You cannot
          allocate more than your available balance.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Users List + Allocation ───────────────────────────────────────────────────

function UsersTab() {
  const { data: users = [], isLoading } = useManagedUsers();
  const allocateMutation = useAllocateMutation();
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [gbInput, setGbInput] = useState("");

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setGbInput(String(Math.round(user.allocated_bytes / 1_073_741_824)));
  };

  const handleSave = () => {
    if (!editing) return;
    const gb = parseFloat(gbInput);
    if (isNaN(gb) || gb <= 0) {
      Alert.alert("Invalid", "Enter a positive number of GB.");
      return;
    }
    const bytes = Math.round(gb * 1_073_741_824);
    allocateMutation.mutate(
      { uid: editing.uid, bytes },
      {
        onSuccess: () => {
          Alert.alert("Done", `Quota for ${editing.displayName} updated to ${gb} GB`);
          setEditing(null);
        },
        onError: (e) => Alert.alert("Error", String(e.message)),
      }
    );
  };

  if (isLoading) return <ActivityIndicator style={styles.loader} color={theme.colors.accent} />;

  return (
    <>
      <ScrollView contentContainerStyle={styles.tabContent}>
        {users.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#d4d4d8" />
            <Text style={styles.emptyText}>No users assigned to you yet</Text>
          </View>
        ) : (
          users.map((u) => {
            const usedPct = u.allocated_bytes > 0 ? (u.used_bytes / u.allocated_bytes) * 100 : 0;
            return (
              <View key={u.uid} style={styles.card}>
                <View style={styles.userCardHeader}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.displayName}</Text>
                    <Text style={styles.userSub}>@{u.uid}</Text>
                  </View>
                  <Pressable style={styles.editBtn} onPress={() => openEdit(u)} hitSlop={8}>
                    <Ionicons name="create-outline" size={18} color={theme.colors.accentBright} />
                  </Pressable>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${Math.min(usedPct, 100)}%` as any, backgroundColor: usedPct > 85 ? "#ef4444" : theme.colors.accent }]} />
                </View>
                <View style={styles.userQuotaRow}>
                  <Text style={styles.userQuotaText}>
                    {formatGb(u.used_bytes)} used of {formatGb(u.allocated_bytes)}
                  </Text>
                  <Text style={styles.userQuotaPct}>{Math.round(usedPct)}%</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit quota modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Set Quota</Text>
            <Text style={styles.modalSub}>{editing?.displayName ?? ""}</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.gbInput}
                value={gbInput}
                onChangeText={setGbInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 50"
                placeholderTextColor="#71717b"
              />
              <Text style={styles.gbUnit}>GB</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, allocateMutation.isPending && styles.disabled]}
                onPress={handleSave}
                disabled={allocateMutation.isPending}
              >
                {allocateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Storage Requests ──────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, { text: string; bg: string; dot: string }> = {
  pending:  { text: "#a16207", bg: "#fef9c3", dot: "#ca8a04" },
  approved: { text: "#15803d", bg: "#dcfce7", dot: "#16a34a" },
  rejected: { text: "#b91c1c", bg: "#fee2e2", dot: "#dc2626" },
};

function RequestsTab() {
  const { data: requests = [], isLoading } = useQuotaRequests();
  const reviewMutation = useReviewRequestMutation();

  const handleReview = (req: QuotaRequest, status: "approved" | "rejected") => {
    const action = status === "approved" ? "Approve" : "Reject";
    Alert.alert(`${action} request?`, `${action} +${formatGb(req.requested_bytes - req.current_bytes)} for ${req.requester_uid}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: action,
        style: status === "rejected" ? "destructive" : "default",
        onPress: () =>
          reviewMutation.mutate(
            { id: req.id, status },
            { onError: (e) => Alert.alert("Error", String(e.message)) }
          ),
      },
    ]);
  };

  if (isLoading) return <ActivityIndicator style={styles.loader} color={theme.colors.accent} />;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {requests.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={40} color="#d4d4d8" />
          <Text style={styles.emptyText}>No storage requests</Text>
        </View>
      ) : (
        requests.map((req) => {
          const cfg    = STATUS_COLOR[req.status] ?? STATUS_COLOR.pending;
          const addedGb = formatGb(Math.max(0, req.requested_bytes - req.current_bytes));
          return (
            <View key={req.id} style={styles.card}>
              <View style={styles.reqHeader}>
                <View>
                  <Text style={styles.reqAmount}>+{addedGb}</Text>
                  <Text style={styles.reqDate}>
                    {new Date(req.created_at * 1000).toLocaleDateString(undefined, {
                      day: "numeric", month: "short",
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                  <Text style={[styles.statusText, { color: cfg.text }]}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.reqMeta}>
                <View style={styles.reqMetaRow}>
                  <Text style={styles.reqMetaLabel}>Requested by</Text>
                  <Text style={styles.reqMetaValue}>{req.requester_uid}</Text>
                </View>
                <View style={styles.reqMetaRow}>
                  <Text style={styles.reqMetaLabel}>Current quota</Text>
                  <Text style={styles.reqMetaValue}>{formatGb(req.current_bytes)}</Text>
                </View>
                <View style={styles.reqMetaRow}>
                  <Text style={styles.reqMetaLabel}>Requested total</Text>
                  <Text style={styles.reqMetaValue}>{formatGb(req.requested_bytes)}</Text>
                </View>
              </View>

              {req.reason ? (
                <Text style={styles.reqReason} numberOfLines={2}>{req.reason}</Text>
              ) : null}

              {req.status === "pending" && (
                <View style={styles.reqActions}>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => handleReview(req, "rejected")}
                    disabled={reviewMutation.isPending}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => handleReview(req, "approved")}
                    disabled={reviewMutation.isPending}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ── Root Screen ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "pool",     label: "Pool",     icon: "server-outline" },
  { id: "users",    label: "Users",    icon: "people-outline" },
  { id: "requests", label: "Requests", icon: "document-text-outline" },
];

export default function AdminQuotaScreen() {
  const router    = useRouter();
  const [tab, setTab] = useState<Tab>("pool");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Storage Allocation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tabItem, tab === t.id && styles.tabItemActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons
              name={t.icon}
              size={18}
              color={tab === t.id ? theme.colors.accentBright : "#71717b"}
            />
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {tab === t.id && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {tab === "pool"     && <PoolTab />}
      {tab === "users"    && <UsersTab />}
      {tab === "requests" && <RequestsTab />}
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

  // Tab bar (underline style)
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#dfe1e4",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    position: "relative",
  },
  tabItemActive: {},
  tabLabel: { fontSize: 13, fontWeight: "500", color: "#71717b" },
  tabLabelActive: { color: theme.colors.accentBright, fontWeight: "600" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.accentBright,
    borderRadius: 1,
  },

  tabContent: { padding: 20, gap: 16, paddingBottom: 40 },
  loader: { marginTop: 60 },

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
  cardLabel: { fontSize: 12, color: "#71717b", textTransform: "uppercase", letterSpacing: 0.5 },
  cardSub: { fontSize: 13, color: "#71717b" },

  // Pool tab
  poolTotal: { fontSize: 36, fontWeight: "700", color: "#09090b" },
  poolStats: { flexDirection: "row", gap: 24, marginTop: 4 },
  poolStatItem: { gap: 2 },
  poolStatValue: { fontSize: 18, fontWeight: "600", color: "#09090b" },
  poolStatLabel: { fontSize: 12, color: "#71717b" },

  // Bar
  barBg: { height: 8, backgroundColor: "#f4f4f5", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: theme.colors.accent, borderRadius: 4 },

  // Users tab
  userCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8e5fd",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 16, fontWeight: "700", color: theme.colors.accent },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "600", color: "#09090b" },
  userSub: { fontSize: 12, color: "#71717b" },
  editBtn: { padding: 6 },
  userQuotaRow: { flexDirection: "row", justifyContent: "space-between" },
  userQuotaText: { fontSize: 12, color: "#71717b" },
  userQuotaPct: { fontSize: 12, fontWeight: "600", color: "#09090b" },

  // Requests tab
  reqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reqAmount: { fontSize: 22, fontWeight: "700", color: "#09090b" },
  reqDate: { fontSize: 12, color: "#71717b", marginTop: 2 },
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
  reqMeta: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  reqMetaRow: { flexDirection: "row", justifyContent: "space-between" },
  reqMetaLabel: { fontSize: 13, color: "#71717b" },
  reqMetaValue: { fontSize: 13, fontWeight: "600", color: "#09090b" },
  reqReason: { fontSize: 13, color: "#71717b" },
  reqActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  rejectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
  rejectBtnText: { fontSize: 14, fontWeight: "600", color: "#b91c1c" },
  approveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  approveBtnText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },

  // Edit quota modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#09090b" },
  modalSub: { fontSize: 14, color: "#71717b", marginTop: -8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f8ff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "#dfe1e4",
    gap: 8,
  },
  gbInput: { flex: 1, fontSize: 20, fontWeight: "600", color: "#09090b" },
  gbUnit: { fontSize: 16, color: "#71717b" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#09090b" },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#ffffff" },
  disabled: { opacity: 0.4 },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#71717b" },
});
