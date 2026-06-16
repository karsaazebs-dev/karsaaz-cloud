/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:5989 — Switch Server bottom sheet
 */

import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUiStore } from "@/src/stores/uiStore";
import { useAuthStore } from "@/src/stores/authStore";

export function SwitchServerSheet() {
  const visible = useUiStore((s) => s.showSwitchServer);
  const setVisible = useUiStore((s) => s.setShowSwitchServer);
  const accounts = useAuthStore((s) => s.accounts);
  const activeAccountId = useAuthStore((s) => s.activeAccountId);
  const switchAccount = useAuthStore((s) => s.switchAccount);
  const router = useRouter();

  const servers = useMemo(() => {
    const seen = new Set<string>();
    return accounts.filter((a) => {
      if (seen.has(a.serverUrl)) return false;
      seen.add(a.serverUrl);
      return true;
    });
  }, [accounts]);

  const activeServer = accounts.find((a) => a.id === activeAccountId)?.serverUrl;

  const handleSelect = async (accountId: string) => {
    await switchAccount(accountId);
    setVisible(false);
  };

  const handleAddServer = () => {
    setVisible(false);
    router.push("/(auth)/login");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Servers</Text>

          {servers.length === 0 ? (
            <Text style={styles.empty}>No servers saved</Text>
          ) : (
            servers.map((account) => {
              const active = account.serverUrl === activeServer;
              return (
                <Pressable
                  key={account.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => handleSelect(account.id)}
                >
                  <View style={[styles.serverIcon, active && styles.serverIconActive]}>
                    <Ionicons name="server-outline" size={20} color={active ? "#ffffff" : "#4e3cf4"} />
                  </View>
                  <View style={styles.serverMeta}>
                    <Text style={styles.serverUrl} numberOfLines={1}>{account.serverUrl}</Text>
                    <Text style={styles.accountName} numberOfLines={1}>{account.displayName || account.username}</Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color="#4e3cf4" />
                  )}
                </Pressable>
              );
            })
          )}

          <View style={styles.divider} />

          <Pressable style={styles.addBtn} onPress={handleAddServer}>
            <View style={styles.addIcon}>
              <Ionicons name="add" size={20} color="#4e3cf4" />
            </View>
            <Text style={styles.addBtnText}>Add Server</Text>
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
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  rowActive: { backgroundColor: "#f5f3ff" },
  serverIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8e5fd",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  serverIconActive: { backgroundColor: "#4e3cf4" },
  serverMeta: { flex: 1 },
  serverUrl: { fontSize: 14, fontWeight: "600", color: "#09090b" },
  accountName: { fontSize: 12, color: "#71717b", marginTop: 2 },
  divider: {
    height: 0.5,
    backgroundColor: "#dfe1e4",
    marginHorizontal: 24,
    marginVertical: 8,
  },
  addBtn: {
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
  addBtnText: { fontSize: 15, fontWeight: "500", color: "#09090b" },
});
