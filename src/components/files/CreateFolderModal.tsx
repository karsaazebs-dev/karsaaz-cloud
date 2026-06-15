/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useUiStore } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

interface CreateFolderModalProps {
  onCreate: (name: string) => void;
  isPending?: boolean;
}

export function CreateFolderModal({ onCreate, isPending }: CreateFolderModalProps) {
  const visible = useUiStore((s) => s.showCreateFolder);
  const setVisible = useUiStore((s) => s.setShowCreateFolder);
  const [name, setName] = useState("");

  const close = () => {
    setName("");
    setVisible(false);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Folder</Text>
          <Text style={styles.subtitle}>Enter a name for your new folder</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} disabled={isPending || !name.trim()}>
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                style={styles.createBtn}
              >
                <Text style={styles.createText}>{isPending ? "Creating…" : "Create"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    padding: 24,
    ...theme.shadow.card,
  },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    color: theme.colors.text,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { color: theme.colors.textMuted, fontWeight: "600" },
  createBtn: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createText: { color: "#fff", fontWeight: "700" },
});
