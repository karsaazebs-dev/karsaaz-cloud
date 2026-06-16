/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:995 — Photos tab with filter bar + masonry grid
 */

import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFiles } from "@/src/hooks/useFiles";
import { getCachedImages } from "@/src/sync/database";
import { cacheEntryToKarsaazFile } from "@/src/utils/cacheFileMapping";
import { useAuthStore } from "@/src/stores/authStore";
import { PhotosGallery } from "@/src/components/photos/PhotosGallery";
import { figmaAssets } from "@/src/constants/assets";
import { getFileDownloadUrl } from "@karsaaz/cloud-api";
import { theme } from "@/src/constants/theme";
import type { KarsaazFile } from "@karsaaz/cloud-api";

export default function PhotosScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useFiles("/");
  const { username, serverUrl, basicAuth } = useAuthStore();
  const cachedQuery = useQuery({
    queryKey: ["cached-images"],
    queryFn: () => getCachedImages(300),
  });

  useEffect(() => {
    refetch();
    cachedQuery.refetch();
  }, []);

  const photos = useMemo(() => {
    const merged = new Map<string, KarsaazFile>();
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

  const resolveUri = (file: KarsaazFile) => {
    const relPath = file.path.replace(`/files/${username}`, "");
    return `${getFileDownloadUrl(serverUrl, username, relPath)}`;
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.push("/(tabs)/files")}>
          <Image source={figmaAssets.login.back} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>Photos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterBar}>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterText}>Photos</Text>
          <Image source={figmaAssets.photos.chevronDownWhite} style={styles.filterChevron} />
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/shared")}>
          <Image source={figmaAssets.home.searchTab} style={styles.searchIcon} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <PhotosGallery
          photos={photos}
          resolveUri={resolveUri}
          resolveHeaders={() => ({ Authorization: `Basic ${basicAuth}` })}
          onPressPhoto={(item) =>
            router.push({
              pathname: "/preview",
              params: { path: item.path, name: item.name, mime: item.mimeType },
            })
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/(tabs)/files")}
      >
        <Image source={figmaAssets.home.fabPlus} style={styles.fabIcon} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { width: 20, height: 20, resizeMode: "contain" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  headerSpacer: { width: 44 },
  filterBar: {
    height: 56,
    backgroundColor: theme.colors.tabBar,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screen,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  filterText: { color: "#ffffff", fontSize: 13 },
  filterChevron: { width: 8, height: 5, resizeMode: "contain", tintColor: "#ffffff" },
  searchIcon: { width: 24, height: 24, resizeMode: "contain", tintColor: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 100,
    width: 65,
    height: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: { width: 65, height: 65, resizeMode: "contain" },
});
