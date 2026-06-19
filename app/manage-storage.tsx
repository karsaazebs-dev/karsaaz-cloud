/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6667 — Manage Storage
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useFiles } from "@/src/hooks/useFiles";
import { useStorageRequestStore } from "@/src/stores/storageRequestStore";
import { StorageUsageBlock } from "@/src/components/storage/StorageUsageBlock";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";
import { formatFileSize, formatRelativeDate } from "@/src/utils/fileFilters";
import type { KarsaazFile } from "@karsaaz/cloud-api";

type Category = "Photos" | "Videos" | "Documents" | "Others";

const CATEGORIES: Category[] = ["Photos", "Videos", "Documents", "Others"];

export default function ManageStorageScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { data: userQuota, refetch: refetchQuota, isLoading: quotaLoading } = useUserQuota();
  const { data: files, deleteMutation, refetch: refetchFiles, isLoading: filesLoading } = useFiles("/");
  const hydrateRequests = useStorageRequestStore((s) => s.hydrate);

  const initialTab = CATEGORIES.includes(tab as Category) ? (tab as Category) : "Photos";
  const [activeCategory, setActiveCategory] = useState<Category>(initialTab);

  useEffect(() => {
    hydrateRequests();
  }, [hydrateRequests]);

  const usedBytes = userQuota?.quota?.used ?? 0;
  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;

  const filteredFiles = (files ?? [])
    .filter((f: KarsaazFile) => {
      if (f.type !== "file") return false;
      const isImg =
        f.fileType === "image" ||
        f.mimeType?.includes("image") ||
        f.name.match(/\.(png|jpe?g|gif|webp|bmp)$/i);
      const isVid =
        f.mimeType?.includes("video") || f.name.match(/\.(mp4|mov|avi|mkv|3gp|wmv)$/i);
      const isDoc =
        f.mimeType?.includes("pdf") ||
        f.mimeType?.includes("document") ||
        f.mimeType?.includes("sheet") ||
        f.mimeType?.includes("text") ||
        f.name.match(/\.(pdf|doc[x]?|xls[x]?|ppt[x]?|txt|rtf|csv)$/i);

      if (activeCategory === "Photos") return isImg;
      if (activeCategory === "Videos") return isVid;
      if (activeCategory === "Documents") return isDoc;
      return !isImg && !isVid && !isDoc;
    })
    .sort((a: KarsaazFile, b: KarsaazFile) => b.size - a.size);

  const confirmDelete = (file: KarsaazFile) => {
    Alert.alert("Delete file", `Remove "${file.name}" from your cloud?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync(file);
          refetchQuota();
          refetchFiles();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Image source={figmaAssets.login.back} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Storage</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StorageUsageBlock usedBytes={usedBytes} totalBytes={totalBytes} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <Pressable
                key={cat}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filesLoading || quotaLoading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
        ) : filteredFiles.length === 0 ? (
          <Text style={styles.emptyText}>No {activeCategory.toLowerCase()} files found.</Text>
        ) : (
          <View style={styles.fileList}>
            {filteredFiles.map((file: KarsaazFile) => (
              <View key={file.path} style={styles.fileRow}>
                <View style={styles.thumb}>
                  <Image source={figmaAssets.home.folderIcon} style={styles.thumbIcon} />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileDate}>
                    {formatFileSize(file.size)} · {formatRelativeDate(file.lastModified)}
                  </Text>
                </View>
                <Pressable onPress={() => confirmDelete(file)} hitSlop={8}>
                  <Image source={figmaAssets.storage.fileMenu} style={styles.menuIcon} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.bottomBtn}
          onPress={() => router.push("/request-storage" as never)}
        >
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomBtnGradient}
          >
            <Text style={styles.bottomBtnText}>Manage Storage</Text>
          </LinearGradient>
        </Pressable>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.text },
  headerSpacer: { width: 44 },
  scroll: { paddingHorizontal: theme.spacing.screen, paddingBottom: 120, gap: 20 },
  categoryRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
  },
  categoryPillTextActive: { color: "#ffffff" },
  fileList: { gap: 8 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 12,
    ...theme.shadow.card,
  },
  thumb: {
    width: 45,
    height: 43,
    borderRadius: theme.radius.sm,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.07)",
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon: { width: 24, height: 24, resizeMode: "contain" },
  fileMeta: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, color: theme.colors.text },
  fileDate: { fontSize: 11, color: theme.colors.textMuted },
  menuIcon: { width: 16, height: 16, resizeMode: "contain" },
  loader: { paddingVertical: 24 },
  emptyText: { color: theme.colors.textMuted, fontStyle: "italic" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: theme.colors.background,
  },
  bottomBtn: {
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    ...theme.shadow.button,
  },
  bottomBtnGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  bottomBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
