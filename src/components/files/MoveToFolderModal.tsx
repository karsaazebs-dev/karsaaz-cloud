/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "@/src/stores/uiStore";
import { useFiles } from "@/src/hooks/useFiles";
import { theme } from "@/src/constants/theme";

export function MoveToFolderModal() {
  const visible = useUiStore((s) => s.showMoveToFolder);
  const setVisible = useUiStore((s) => s.setShowMoveToFolder);
  const fileToMove = useUiStore((s) => s.actionFile) ?? useUiStore((s) => s.actionFolder);
  const setActionFile = useUiStore((s) => s.setActionFile);
  const setActionFolder = useUiStore((s) => s.setActionFolder);

  const [currentPath, setCurrentPath] = useState("/");
  const { data: files, moveMutation, mkdirMutation, isLoading } = useFiles(currentPath);

  // Filter directories to browse, excluding the folder itself if we are moving a folder
  const directories = (files ?? []).filter(
    (f) => f.type === "directory" && f.path !== fileToMove?.path
  );

  const handleBack = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath("/" + parts.join("/"));
  };

  const handleFolderPress = (folderPath: string, username: string) => {
    const rel = folderPath.replace(`/files/${username}`, "") || "/";
    setCurrentPath(rel);
  };

  const handleCreateFolder = () => {
    Alert.prompt("New Folder", "Enter folder name:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Create",
        onPress: (name) => {
          if (name?.trim()) {
            mkdirMutation.mutate(name.trim());
          }
        },
      },
    ]);
  };

  const handleMoveHere = () => {
    if (!fileToMove) return;
    moveMutation.mutate(
      { file: fileToMove, targetFolderPath: currentPath },
      {
        onSuccess: () => {
          Alert.alert("Success", `Moved "${fileToMove.name}" successfully.`);
          close();
        },
        onError: (err) => {
          Alert.alert("Error", `Failed to move: ${String(err)}`);
        },
      }
    );
  };

  const close = () => {
    setCurrentPath("/");
    setActionFile(null);
    setActionFolder(null);
    setVisible(false);
  };

  if (!fileToMove) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            {currentPath !== "/" ? (
              <Pressable onPress={handleBack} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
              </Pressable>
            ) : (
              <View style={styles.spacer} />
            )}
            <Text style={styles.title} numberOfLines={1}>
              Move to...
            </Text>
            <Pressable onPress={handleCreateFolder} style={styles.iconBtn}>
              <Ionicons name="folder-add-outline" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Current Path Info */}
          <View style={styles.pathBar}>
            <Ionicons name="folder-open-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.pathText} numberOfLines={1}>
              {currentPath}
            </Text>
          </View>

          {/* Moving file indicator */}
          <View style={styles.movingInfo}>
            <Text style={styles.movingLabel}>Moving:</Text>
            <Text style={styles.movingName} numberOfLines={1}>
              {fileToMove.name}
            </Text>
          </View>

          {/* Folders List */}
          {isLoading ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
          ) : directories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No subfolders in this directory.</Text>
            </View>
          ) : (
            <FlatList
              data={directories}
              keyExtractor={(item) => item.path}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.folderRow}
                  onPress={() => handleFolderPress(item.path, fileToMove.path.split("/")[2])}
                >
                  <Ionicons name="folder" size={24} color="#ff7900" />
                  <Text style={styles.folderName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
                </Pressable>
              )}
            />
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.moveBtn, moveMutation.isPending && styles.disabled]}
              onPress={handleMoveHere}
              disabled={moveMutation.isPending}
            >
              {moveMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.moveBtnText}>Move Here</Text>
                </>
              )}
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    height: "70%",
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: { fontSize: 18, fontWeight: "600", color: theme.colors.text, flex: 1, textAlign: "center" },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  spacer: { width: 40 },
  pathBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  pathText: { fontSize: 13, color: theme.colors.textMuted, fontWeight: "500" },
  movingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
  },
  movingLabel: { fontSize: 13, color: theme.colors.textMuted },
  movingName: { fontSize: 13, fontWeight: "600", color: theme.colors.textDark, flex: 1 },
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
  },
  folderName: { fontSize: 15, color: theme.colors.text, flex: 1, fontWeight: "500" },
  loader: { flex: 1, justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: theme.colors.textMuted },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: theme.colors.textSecondary, fontWeight: "600" },
  moveBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    height: 48,
  },
  moveBtnText: { color: "#fff", fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
