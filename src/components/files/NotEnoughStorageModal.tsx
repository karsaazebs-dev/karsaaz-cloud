/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUiStore } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

export function NotEnoughStorageModal() {
  const router = useRouter();
  const visible = useUiStore((s) => s.showNotEnoughStorage);
  const setVisible = useUiStore((s) => s.setShowNotEnoughStorage);

  const handleCleanUp = () => {
    setVisible(false);
    router.push("/manage-storage");
  };

  const handleRequest = () => {
    setVisible(false);
    router.push("/request-storage");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.closeBtn} onPress={() => setVisible(false)}>
            <Ionicons name="close" size={20} color={theme.colors.textMuted} />
          </Pressable>

          <View style={styles.iconContainer}>
            <Ionicons name="cloud-offline" size={48} color="#dc2626" />
          </View>

          <Text style={styles.title}>Out of Storage Space</Text>
          <Text style={styles.description}>
            You have used 98% of your allotted storage limit (500 GB). You won't be able to upload or sync new files until you free up space or request an upgrade.
          </Text>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnSecondary]} onPress={handleCleanUp}>
              <Ionicons name="trash-outline" size={16} color={theme.colors.text} />
              <Text style={styles.btnSecondaryText}>Clean Up Files</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleRequest}>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={styles.btnPrimaryText}>Request Storage</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: "center",
    position: "relative",
    ...theme.shadow.card,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textDark,
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: theme.radius.md,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
});
