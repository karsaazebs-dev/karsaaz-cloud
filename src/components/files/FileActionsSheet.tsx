/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

interface Action {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

const ACTIONS: Action[] = [
  { id: "edit", label: "Edit", icon: "create-outline" },
  { id: "details", label: "Details", icon: "information-circle-outline" },
  { id: "download", label: "Download", icon: "download-outline" },
  { id: "export", label: "Export", icon: "share-outline" },
  { id: "share", label: "Share", icon: "person-add-outline" },
  { id: "wallpaper", label: "Use picture as", icon: "image-outline" },
  { id: "delete", label: "Delete", icon: "trash-outline", destructive: true },
];

interface FileActionsSheetProps {
  onAction: (actionId: string, file: KarsaazFile) => void;
}

export function FileActionsSheet({ onAction }: FileActionsSheetProps) {
  const file = useUiStore((s) => s.actionFile);
  const setActionFile = useUiStore((s) => s.setActionFile);

  if (!file) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setActionFile(null)}>
      <Pressable style={styles.backdrop} onPress={() => setActionFile(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>{file.name}</Text>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.row}
              onPress={() => {
                const target = file;
                setActionFile(null);
                onAction(action.id, target);
              }}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={action.destructive ? "#dc2626" : theme.colors.text}
              />
              <Text style={[styles.label, action.destructive && styles.destructive]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  label: { fontSize: 15, color: theme.colors.text },
  destructive: { color: "#dc2626" },
});
