/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { theme } from "../../constants/theme";

interface FileListProps {
  files: KarsaazFile[];
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onOpen: (file: KarsaazFile) => void;
  onLongPress?: (file: KarsaazFile) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({
  files,
  isLoading,
  isRefetching,
  onRefresh,
  onOpen,
  onLongPress,
}: FileListProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.path}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => onOpen(item)}
          onLongPress={() => onLongPress?.(item)}
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={item.type === "directory" ? "folder" : "document-text-outline"}
              size={24}
              color={item.type === "directory" ? "#ff7900" : theme.colors.accent}
            />
          </View>
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.sub}>
              {item.type === "directory" ? "Folder" : formatSize(item.size)}
            </Text>
          </View>
          <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textMuted} />
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>This folder is empty</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: theme.spacing.screen, gap: 8, paddingBottom: 120 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 12,
    ...theme.shadow.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textSubtle, marginTop: 2 },
  empty: { textAlign: "center", color: theme.colors.textMuted, marginTop: 40 },
});
