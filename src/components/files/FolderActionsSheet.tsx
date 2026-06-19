/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { theme } from "@/src/constants/theme";
import { figmaAssets } from "@/src/constants/assets";
import { useTagsStore, parseTagDisplay } from "@/src/stores/tagsStore";

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

  const fileTags = useTagsStore((s) => s.fileTags);
  const assigned = fileTags[folder.path] ?? [];
  const firstTag = assigned[0];
  const activeTagColor = firstTag ? parseTagDisplay(firstTag).color : "#3b82f6";

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setActionFolder(null)}>
      <Pressable style={styles.backdrop} onPress={() => setActionFolder(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.folderHeader}>
            <View style={styles.folderIconContainer}>
              <Image source={figmaAssets.home.folderIcon} style={styles.folderIcon} />
            </View>
            <View style={styles.folderMeta}>
              <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
              <View style={styles.tagIndicatorRow}>
                <Ionicons name="pricetags-outline" size={16} color="#9ca3af" />
                <View style={[styles.colorTag, { backgroundColor: activeTagColor }]} />
              </View>
            </View>
          </View>
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
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f59e0b", // Orange/Yellow background
    alignItems: "center",
    justifyContent: "center",
  },
  folderIcon: {
    width: 26,
    height: 26,
    tintColor: "#ffffff", // White icon inside
  },
  folderMeta: {
    flex: 1,
    justifyContent: "center",
  },
  folderName: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginBottom: 2,
  },
  tagIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorTag: {
    width: 20,
    height: 12,
    borderRadius: 4,
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
