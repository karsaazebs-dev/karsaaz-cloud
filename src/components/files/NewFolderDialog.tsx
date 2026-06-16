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
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/src/constants/theme";

const INVALID_CHARS = /[/\\]/;
const MAX_LEN = 255;

interface NewFolderDialogProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isPending?: boolean;
  error?: string | null;
}

export function NewFolderDialog({ visible, onClose, onCreate, isPending, error }: NewFolderDialogProps) {
  const [name, setName] = useState("");

  const validationError = (() => {
    if (!name.trim()) return null;
    if (INVALID_CHARS.test(name)) return 'Name cannot contain "/" or "\\"';
    if (name.length > MAX_LEN) return `Name must be ${MAX_LEN} characters or fewer`;
    return null;
  })();

  const canSubmit = name.trim().length > 0 && !validationError && !isPending;

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleCreate = () => {
    if (!canSubmit) return;
    onCreate(name.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>New Folder</Text>
          <Text style={styles.subtitle}>Enter a name for the new folder</Text>
          <TextInput
            style={[styles.input, (validationError || error) ? styles.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            maxLength={MAX_LEN + 1}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          {(validationError || error) && (
            <Text style={styles.error}>{validationError ?? error}</Text>
          )}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={handleClose} disabled={isPending}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleCreate} disabled={!canSubmit}>
              <LinearGradient
                colors={canSubmit
                  ? [theme.colors.gradientStart, theme.colors.gradientEnd]
                  : ["#d1d5db", "#d1d5db"]}
                style={styles.createBtn}
              >
                {isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.createText}>Create</Text>}
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
    marginBottom: 4,
    color: theme.colors.text,
  },
  inputError: { borderColor: "#ef4444" },
  error: { fontSize: 12, color: "#ef4444", marginBottom: 16 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { color: theme.colors.textMuted, fontWeight: "600" },
  createBtn: { borderRadius: theme.radius.md, paddingVertical: 12, paddingHorizontal: 24, minWidth: 72, alignItems: "center" },
  createText: { color: "#fff", fontWeight: "700" },
});
