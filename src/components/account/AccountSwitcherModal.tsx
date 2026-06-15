/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "@/src/stores/uiStore";
import { useAuthStore } from "@/src/stores/authStore";
import { theme } from "@/src/constants/theme";

export function AccountSwitcherModal() {
  const visible = useUiStore((s) => s.showAccountSwitcher);
  const setVisible = useUiStore((s) => s.setShowAccountSwitcher);
  const accounts = useAuthStore((s) => s.accounts);
  const activeAccountId = useAuthStore((s) => s.activeAccountId);
  const switchAccount = useAuthStore((s) => s.switchAccount);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Switch Account</Text>
          {accounts.length === 0 ? (
            <Text style={styles.empty}>No saved accounts</Text>
          ) : (
            accounts.map((account) => {
              const active = account.id === activeAccountId;
              return (
                <Pressable
                  key={account.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={async () => {
                    await switchAccount(account.id);
                    setVisible(false);
                  }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {account.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.name}>{account.displayName}</Text>
                    <Text style={styles.server} numberOfLines={1}>{account.username}</Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.accent} />
                  )}
                </Pressable>
              );
            })
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    ...theme.shadow.card,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: theme.colors.text },
  empty: { color: theme.colors.textMuted, textAlign: "center", paddingVertical: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
  },
  rowActive: { backgroundColor: theme.colors.infoBg, borderRadius: theme.radius.md, paddingHorizontal: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: theme.colors.accent },
  meta: { flex: 1 },
  name: { fontWeight: "600", color: theme.colors.text },
  server: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
