/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFiles } from "@/src/hooks/useFiles";
import { getCachedImages } from "@/src/sync/database";
import { cacheEntryToKarsaazFile } from "@/src/utils/cacheFileMapping";
import { useAuthStore } from "@/src/stores/authStore";
import { ConnectionStatus } from "@/src/components/ui/ConnectionStatus";
import { getFileDownloadUrl } from "@karsaaz/cloud-api";
import { theme } from "@/src/constants/theme";

const COLS = 3;
const GAP = 2;
const SIZE = (Dimensions.get("window").width - GAP * (COLS + 1)) / COLS;

export default function PhotosScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useFiles("/");
  const { username, serverUrl, basicAuth, displayName } = useAuthStore();
  const cachedQuery = useQuery({
    queryKey: ["cached-images"],
    queryFn: () => getCachedImages(300),
  });

  useEffect(() => {
    refetch();
    cachedQuery.refetch();
  }, []);

  const photos = useMemo(() => {
    const merged = new Map<string, ReturnType<typeof cacheEntryToKarsaazFile>>();
    for (const row of cachedQuery.data ?? []) {
      const file = cacheEntryToKarsaazFile(row);
      merged.set(file.path, file);
    }
    for (const file of data ?? []) {
      if (file.fileType === "image") merged.set(file.path, file);
    }
    return Array.from(merged.values()).sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
    );
  }, [cachedQuery.data, data]);

  const loading = isLoading || cachedQuery.isLoading;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <ConnectionStatus />
        <View style={styles.headerActions}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>Photos</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={COLS}
          keyExtractor={(item) => item.path}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const relPath = item.path.replace(`/files/${username}`, "");
            const uri = `${getFileDownloadUrl(serverUrl, username, relPath)}`;
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/preview",
                    params: { path: item.path, name: item.name, mime: item.mimeType },
                  })
                }
              >
                <Image
                  source={{
                    uri,
                    headers: { Authorization: `Basic ${basicAuth}` },
                  }}
                  style={styles.thumb}
                />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No photos in your cloud yet</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "600", color: theme.colors.accent },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.screen,
    marginBottom: 12,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { padding: GAP, paddingBottom: 120 },
  thumb: {
    width: SIZE,
    height: SIZE,
    margin: GAP,
    borderRadius: 4,
    backgroundColor: theme.colors.borderLight,
  },
  empty: { textAlign: "center", color: theme.colors.textMuted, marginTop: 40 },
});
