/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";
import { figmaAssets } from "@/src/constants/assets";
import { useTagsStore, parseTagDisplay } from "@/src/stores/tagsStore";

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
  { id: "move", label: "Move to Folder", icon: "folder-open-outline" },
  { id: "wallpaper", label: "Use picture as", icon: "image-outline" },
  { id: "delete", label: "Delete", icon: "trash-outline", destructive: true },
];

function fileIconColor(file: KarsaazFile): string {
  if (file.fileType === "image") return theme.colors.storageImages;
  if (file.mimeType?.includes("video")) return theme.colors.storageVideos;
  if (file.mimeType?.includes("pdf")) return "#e64343";
  return theme.colors.accent;
}

function fileIconName(file: KarsaazFile): keyof typeof Ionicons.glyphMap {
  if (file.fileType === "image") return "image-outline";
  if (file.mimeType?.includes("video")) return "videocam-outline";
  if (file.mimeType?.includes("pdf")) return "document-outline";
  return "document-text-outline";
}

function fileTypeIcon(file: KarsaazFile): number | null {
  if (file.mimeType?.includes("pdf") || file.name.endsWith(".pdf")) return figmaAssets.home.pdfIcon;
  if (file.mimeType?.includes("video") || file.name.match(/\.(mp4|mov|avi)$/i)) return figmaAssets.home.videoIcon;
  if (file.mimeType?.includes("spreadsheet") || file.name.match(/\.xls/i)) return figmaAssets.home.excelIcon;
  return null;
}

interface FileActionsSheetProps {
  onAction: (actionId: string, file: KarsaazFile) => void;
}

export function FileActionsSheet({ onAction }: FileActionsSheetProps) {
  const file = useUiStore((s) => s.actionFile);
  const setActionFile = useUiStore((s) => s.setActionFile);

  if (!file) return null;

  const fileTags = useTagsStore((s) => s.fileTags);
  const assigned = fileTags[file.path] ?? [];
  const firstTag = assigned[0];
  const activeTagColor = firstTag ? parseTagDisplay(firstTag).color : "#3b82f6";

  const fIcon = fileTypeIcon(file);
  const bgCol = fIcon ? "#f3f4f6" : `${fileIconColor(file)}14`;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => setActionFile(null)}>
      <Pressable style={styles.backdrop} onPress={() => setActionFile(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.fileHeader}>
            <View style={[styles.fileIconContainer, { backgroundColor: bgCol }]}>
              {fIcon ? (
                <Image source={fIcon} style={styles.fileTypeIcon} />
              ) : (
                <Ionicons name={fileIconName(file)} size={24} color={fileIconColor(file)} />
              )}
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <View style={styles.tagIndicatorRow}>
                <Ionicons name="pricetags-outline" size={16} color="#9ca3af" />
                <View style={[styles.colorTag, { backgroundColor: activeTagColor }]} />
              </View>
            </View>
          </View>
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
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileTypeIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  fileMeta: {
    flex: 1,
    justifyContent: "center",
  },
  fileName: {
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
