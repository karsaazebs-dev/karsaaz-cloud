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
import { useTrash } from "@/src/hooks/useTrashVersions";
import { ConnectionStatus } from "@/src/components/ui/ConnectionStatus";
import { theme } from "@/src/constants/theme";

export default function TrashScreen() {
  const { trashQuery, restoreMutation } = useTrash();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <ConnectionStatus />
        <Text style={styles.title}>Deleted files</Text>
      </View>

      {trashQuery.isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
      ) : (
        <FlatList
          data={trashQuery.data ?? []}
          keyExtractor={(item) => String(item.fileId)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={trashQuery.isRefetching}
              onRefresh={() => trashQuery.refetch()}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.textMuted} />
              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.sub}>
                  Deleted {new Date(item.deletionTime * 1000).toLocaleDateString()}
                </Text>
              </View>
              <Pressable
                style={styles.restoreBtn}
                onPress={() => restoreMutation.mutate(item.fileId)}
                disabled={restoreMutation.isPending}
              >
                <Text style={styles.restoreText}>Restore</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Trash is empty</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
  list: { paddingHorizontal: theme.spacing.screen, paddingBottom: 120, gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.4,
    borderColor: theme.colors.borderLight,
    ...theme.shadow.card,
  },
  meta: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  restoreBtn: {
    backgroundColor: theme.colors.infoBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  restoreText: { color: theme.colors.accent, fontWeight: "600", fontSize: 13 },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: theme.colors.textMuted, marginTop: 40 },
});
