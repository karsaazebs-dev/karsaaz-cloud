/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 1:5272 (account list) and 1:5624 (with storage info)
 */

import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "@/src/stores/uiStore";
import { useAuthStore } from "@/src/stores/authStore";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { theme } from "@/src/constants/theme";

function StorageBar({ used, total }: { used: number; total: number }) {
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  const usedGB = (used / 1e9).toFixed(1);
  const totalGB = (total / 1e9).toFixed(1);

  return (
    <View style={bar.wrap}>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={bar.label}>{usedGB} GB of {totalGB} GB used</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  wrap: { marginTop: 6, gap: 4 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e4e4e7",
    overflow: "hidden",
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: "#4e3cf4" },
  label: { fontSize: 11, color: "#71717b" },
});

export function AccountSwitcherModal() {
  const visible = useUiStore((s) => s.showAccountSwitcher);
  const setVisible = useUiStore((s) => s.setShowAccountSwitcher);
  const setShowSwitchServer = useUiStore((s) => s.setShowSwitchServer);
  const accounts = useAuthStore((s) => s.accounts);
  const activeAccountId = useAuthStore((s) => s.activeAccountId);
  const switchAccount = useAuthStore((s) => s.switchAccount);
  const { data: quota } = useUserQuota();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Accounts</Text>

          {accounts.length === 0 ? (
            <Text style={styles.empty}>No saved accounts</Text>
          ) : (
            accounts.map((account) => {
              const active = account.id === activeAccountId;
              const initial = (account.displayName || account.username).charAt(0).toUpperCase();
              return (
                <Pressable
                  key={account.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={async () => {
                    if (!active) {
                      await switchAccount(account.id);
                    }
                    setVisible(false);
                  }}
                >
                  <View style={[styles.avatar, active && styles.avatarActive]}>
                    <Text style={[styles.avatarText, active && styles.avatarTextActive]}>
                      {initial}
                    </Text>
                  </View>
                  <View style={styles.accountMeta}>
                    <View style={styles.accountHeader}>
                      <Text style={styles.displayName} numberOfLines={1}>
                        {account.displayName || account.username}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark-circle" size={18} color="#4e3cf4" />
                      )}
                    </View>
                    <Text style={styles.serverUrl} numberOfLines={1}>
                      {account.serverUrl}
                    </Text>
                    {active && quota && (
                      <StorageBar
                        used={(quota as any)?.quota?.used ?? 0}
                        total={(quota as any)?.quota?.total ?? 0}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}

          <View style={styles.divider} />

          <Pressable
            style={styles.addServerBtn}
            onPress={() => {
              setVisible(false);
              setShowSwitchServer(true);
            }}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={20} color="#4e3cf4" />
            </View>
            <Text style={styles.addServerText}>Add account</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  handle: {
    width: 30,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(34,34,34,0.72)",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#09090b",
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  empty: {
    color: "#71717b",
    textAlign: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  rowActive: {
    backgroundColor: "#f5f3ff",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8e5fd",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarActive: { backgroundColor: "#4e3cf4" },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#4e3cf4" },
  avatarTextActive: { color: "#ffffff" },
  accountMeta: { flex: 1 },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  displayName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#09090b",
  },
  serverUrl: { fontSize: 12, color: "#71717b", marginTop: 2 },
  divider: {
    height: 0.5,
    backgroundColor: "#dfe1e4",
    marginHorizontal: 24,
    marginVertical: 8,
  },
  addServerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  addServerText: { fontSize: 15, fontWeight: "500", color: "#09090b" },
});
