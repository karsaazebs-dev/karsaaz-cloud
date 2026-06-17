/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { theme } from "@/src/constants/theme";

interface Action {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

const BASE_FOLDER_ACTIONS: Action[] = [
  { id: "details", label: "Details", icon: "information-circle-outline" },
  { id: "tag", label: "Tag", icon: "pricetag-outline" },
  { id: "rename", label: "Rename", icon: "create-outline" },
  { id: "edit", label: "Edit", icon: "pencil-outline" },
  { id: "move", label: "Move to folder", icon: "folder-open-outline" },
  { id: "export", label: "Export", icon: "exit-outline" },
  { id: "share", label: "Share / Activity", icon: "share-social-outline" },
  { id: "sync", label: "Sync", icon: "sync-outline" },
  { id: "pin", label: "Pin", icon: "pin-outline" },
  { id: "delete", label: "Delete", icon: "trash-outline", destructive: true },
];

interface FolderActionsSheetProps {
  onAction: (actionId: string, folder: KarsaazFile) => void;
}

export function FolderActionsSheet({ onAction }: FolderActionsSheetProps) {
  const folder = useUiStore((s) => s.actionFolder);
  const setActionFolder = useUiStore((s) => s.setActionFolder);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  if (!folder) return null;

  const alreadyFav = isFavorite(folder.path);

  const actions: Action[] = [
    {
      id: "favourite",
      label: alreadyFav ? "Remove from favourite" : "Add to favourite",
      icon: alreadyFav ? "star" : "star-outline",
    },
    ...BASE_FOLDER_ACTIONS,
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setActionFolder(null)}>
      <Pressable style={styles.backdrop} onPress={() => setActionFolder(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>{folder.name}</Text>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {actions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.row}
                onPress={() => {
                  const target = folder;
                  setActionFolder(null);
                  onAction(action.id, target);
                }}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.destructive ? "#dc2626" : action.id === "favourite" && alreadyFav ? "#f59e0b" : theme.colors.text}
                />
                <Text style={[styles.label, action.destructive && styles.destructive]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
    maxHeight: "80%",
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
