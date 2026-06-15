/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect, useState } from "react";
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
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { theme } from "@/src/constants/theme";

interface RenameModalProps {
  file: KarsaazFile | null;
  onClose: () => void;
  onRename: (file: KarsaazFile, newName: string) => void;
  isPending?: boolean;
}

export function RenameModal({ file, onClose, onRename, isPending }: RenameModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(file?.name ?? "");
  }, [file]);

  const submit = () => {
    if (!file) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === file.name) {
      onClose();
      return;
    }
    onRename(file, trimmed);
    onClose();
  };

  return (
    <Modal visible={Boolean(file)} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Rename</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} disabled={isPending || !name.trim()}>
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>{isPending ? "Saving…" : "Save"}</Text>
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
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16, color: theme.colors.text },
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
  saveBtn: { borderRadius: theme.radius.md, paddingVertical: 12, paddingHorizontal: 24 },
  saveText: { color: "#fff", fontWeight: "700" },
});
