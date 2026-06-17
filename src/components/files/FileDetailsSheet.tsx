/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:2034 — File Details bottom sheet
 */

import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { theme } from "@/src/constants/theme";
import { formatFileSize } from "@/src/utils/fileFilters";
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";

interface Action {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

const BASE_ACTIONS: Action[] = [
  { id: "edit", label: "Edit", icon: "create-outline" },
  { id: "details", label: "Details", icon: "information-circle-outline" },
  { id: "rename", label: "Rename", icon: "pencil-outline" },
  { id: "tag", label: "Tag", icon: "pricetag-outline" },
  { id: "export", label: "Export", icon: "exit-outline" },
  { id: "share", label: "Share/Activity", icon: "share-social-outline" },
  { id: "sync", label: "Sync", icon: "sync-outline" },
  { id: "move", label: "Move to folder", icon: "folder-open-outline" },
  { id: "pin", label: "Pin", icon: "pin-outline" },
  { id: "delete", label: "Delete", icon: "trash-outline", destructive: true },
];

interface FileDetailsSheetProps {
  onAction: (actionId: string, file: KarsaazFile) => void;
}

export function FileDetailsSheet({ onAction }: FileDetailsSheetProps) {
  const file = useUiStore((s) => s.actionFile);
  const setActionFile = useUiStore((s) => s.setActionFile);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);

  if (!file) return null;

  const alreadyFav = isFavorite(file.path);

  const actions: Action[] = [
    BASE_ACTIONS[0],
    {
      id: "favourite",
      label: alreadyFav ? "Remove from favourite" : "Add to favourite",
      icon: alreadyFav ? "star" : "star-outline",
    },
    ...BASE_ACTIONS.slice(1),
  ];

  // #region agent log
  phase1DebugLog(
    "FileDetailsSheet.tsx:render",
    "file menu rendered",
    { actionCount: actions.length, fileName: file.name },
    "H1"
  );
  // #endregion

  const isImage = file.fileType === "image" || file.mimeType?.startsWith("image/");

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setActionFile(null)}>
      <Pressable style={styles.backdrop} onPress={() => setActionFile(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.fileHeader}>
            <View style={styles.thumb}>
              <Ionicons
                name={isImage ? "image-outline" : "document-outline"}
                size={28}
                color="#4e3cf4"
              />
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
              <Text style={styles.fileSub}>
                {formatFileSize(file.size)} • {file.lastModified.toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {actions.map((action) => (
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
                  size={22}
                  color={action.destructive ? "#b71d21" : action.id === "favourite" && alreadyFav ? "#f59e0b" : "#09090b"}
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingTop: 8,
    maxHeight: "85%",
  },
  handle: {
    width: 30,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(34,34,34,0.72)",
    alignSelf: "center",
    marginBottom: 16,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  thumb: {
    width: 57,
    height: 57,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: "500", color: "#5c5c5c" },
  fileSub: { fontSize: 13, color: "#71717b", marginTop: 4 },
  divider: {
    height: 0.5,
    backgroundColor: "#dfe1e4",
    marginHorizontal: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  label: { fontSize: 16, fontWeight: "300", color: "#09090b" },
  destructive: { color: "#b71d21" },
});
