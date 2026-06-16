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
import { Ionicons } from "@expo/vector-icons";
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
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#09090b" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Photos</Text>
        </View>
        <Pressable hitSlop={8}>
          <Ionicons name="search-outline" size={24} color="#09090b" />
        </Pressable>
      </View>

      <View style={styles.filterBar}>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterText}>Photos</Text>
          <Ionicons name="chevron-down" size={16} color="#ffffff" />
        </Pressable>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterText}>Videos</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4e3cf4" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#09090b",
  },
  filterBar: {
    height: 56,
    backgroundColor: "#1d1f2b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: { color: "#ffffff", fontSize: 14, fontWeight: "500" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
