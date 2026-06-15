/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import type { BrowseFilter } from "@/src/stores/uiStore";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { ConnectionStatus } from "@/src/components/ui/ConnectionStatus";
import { useSharing } from "@/src/hooks/useSharing";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useAuthStore } from "@/src/stores/authStore";
import { sharePathToDavPath } from "@/src/utils/cacheFileMapping";
import { figmaAssets } from "@/src/constants/assets";
import { formatFileSize, formatRelativeDate } from "@/src/utils/fileFilters";
import { theme } from "@/src/constants/theme";
import { useEffect } from "react";
import { debugLog } from "@/src/utils/debugLog";

export type QuickAccessId = "docs" | "pdf" | "favorites" | "shared" | "videos" | "more";

const QUICK_ACCESS_ITEMS: { id: QuickAccessId; label: string; icon: number }[] = [
  { id: "docs", label: "Docs", icon: figmaAssets.home.docsQuick },
  { id: "pdf", label: "PDF", icon: figmaAssets.home.pdfQuick },
  { id: "favorites", label: "Favourites", icon: figmaAssets.home.favQuick },
  { id: "shared", label: "Shared", icon: figmaAssets.home.sharedQuick },
  { id: "videos", label: "Videos", icon: figmaAssets.home.videosQuick },
  { id: "more", label: "More", icon: figmaAssets.home.menuTab },
];

interface DashboardViewProps {
  files: KarsaazFile[];
  displayName: string;
  onOpenFolder: (file: KarsaazFile) => void;
  onOpenFile: (file: KarsaazFile) => void;
  onViewAll: (section: "folders" | "recent" | "shared", filter: BrowseFilter) => void;
  onQuickAccess: (item: QuickAccessId) => void;
  onAvatarPress?: () => void;
  onFileMenu?: (file: KarsaazFile) => void;
  onFolderMenu?: (file: KarsaazFile) => void;
}

function fileIconName(file: KarsaazFile): keyof typeof Ionicons.glyphMap {
  if (file.type === "directory") return "folder";
  if (file.fileType === "image") return "image-outline";
  if (file.mimeType?.includes("video")) return "videocam-outline";
  if (file.mimeType?.includes("pdf")) return "document-outline";
  if (file.mimeType?.includes("spreadsheet") || file.name.endsWith(".xls")) {
    return "grid-outline";
  }
  return "document-text-outline";
}

function fileTypeIcon(file: KarsaazFile): number | null {
  if (file.mimeType?.includes("pdf") || file.name.endsWith(".pdf")) return figmaAssets.home.pdfIcon;
  if (file.mimeType?.includes("video") || file.name.match(/\.(mp4|mov|avi)$/i)) {
    return figmaAssets.home.videoIcon;
  }
  if (file.mimeType?.includes("spreadsheet") || file.name.match(/\.xls/i)) {
    return figmaAssets.home.excelIcon;
  }
  return null;
}

function folderMetaLabel(folder: KarsaazFile): string {
  if (folder.size > 0) {
    return formatFileSize(folder.size);
  }
  return "Empty folder";
}

function fileIconColor(file: KarsaazFile): string {
  if (file.type === "directory") return "#ff7900";
  if (file.fileType === "image") return theme.colors.storageImages;
  if (file.mimeType?.includes("video")) return theme.colors.storageVideos;
  if (file.mimeType?.includes("pdf")) return "#e64343";
  return theme.colors.accent;
}

export function DashboardView({
  files,
  displayName,
  onOpenFolder,
  onOpenFile,
  onViewAll,
  onQuickAccess,
  onAvatarPress,
  onFileMenu,
  onFolderMenu,
}: DashboardViewProps) {
  const username = useAuthStore((s) => s.username);
  const { sharesQuery } = useSharing();
  const { data: userQuota } = useUserQuota();
  const folders = files.filter((f) => f.type === "directory").slice(0, 4);
  const recent = files
    .filter((f) => f.type === "file")
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, 5);
  const sharedWithMe = (sharesQuery.data ?? []).slice(0, 3);
  const sharedPaths = new Set(
    (sharesQuery.data ?? []).map((s) => sharePathToDavPath(s.path, username))
  );
  const usedBytes = userQuota?.quota?.used ?? files.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const isUnlimited = totalBytes < 0;
  const usedGb = Math.max(usedBytes / (1024 * 1024 * 1024), 0.1);
  const totalGb = isUnlimited ? 0 : totalBytes / (1024 * 1024 * 1024);

  useEffect(() => {
    debugLog(
      "DashboardView.tsx:mount",
      "dashboard sections",
      {
        folderCount: folders.length,
        recentCount: recent.length,
        sharedCount: sharedWithMe.length,
        sharesLoading: sharesQuery.isLoading,
        sharesError: sharesQuery.isError,
        totalFiles: files.length,
        usedBytes,
        totalBytes,
        quotaFromApi: Boolean(userQuota?.quota),
      },
      "D"
    );
  }, [
    folders.length,
    recent.length,
    sharedWithMe.length,
    sharesQuery.isLoading,
    sharesQuery.isError,
    files.length,
    usedBytes,
    totalBytes,
    userQuota?.quota,
  ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView edges={["top"]} style={styles.topSafe}>
      <View style={styles.header}>
        <ConnectionStatus />
        <View style={styles.headerActions}>
          <Image source={figmaAssets.home.bell} style={styles.headerIcon} />
          <Pressable onPress={onAvatarPress}>
            <Image source={figmaAssets.home.avatar} style={styles.avatarImage} />
          </Pressable>
        </View>
      </View>

      <View style={styles.storageCard}>
        <Text style={styles.storageLabel}>Alloted Storage</Text>
        <Text style={styles.storageUsed}>
          <Text style={styles.storageBold}>
            {isUnlimited
              ? `${formatFileSize(usedBytes)} `
              : totalGb >= 1
              ? `${Math.round(usedGb)} GB `
              : `${formatFileSize(usedBytes)} `}
          </Text>
          <Text style={styles.storageMuted}>
            {isUnlimited
              ? "of Unlimited used"
              : totalGb >= 1
              ? `of ${Math.round(totalGb)} GB used`
              : `of ${formatFileSize(totalBytes)} used`}
          </Text>
        </Text>
        <View style={styles.storageBar}>
          <View style={[styles.barSeg, { flex: Math.min(usedGb, 3), backgroundColor: theme.colors.storageImages }]} />
          <View style={[styles.barSeg, { flex: 2, backgroundColor: theme.colors.storageDocs }]} />
          <View style={[styles.barSeg, { flex: 1, backgroundColor: theme.colors.storageVideos }]} />
          <View style={[styles.barSeg, { flex: 1, backgroundColor: theme.colors.storageOther }]} />
          <View style={[styles.barSeg, { flex: Math.max(10 - usedGb, 3), backgroundColor: theme.colors.storageEmpty }]} />
        </View>
        <View style={styles.legend}>
          {[
            ["Images", theme.colors.storageImages],
            ["Documents", theme.colors.storageDocs],
            ["Videos", theme.colors.storageVideos],
            ["Others", theme.colors.storageOther],
          ].map(([label, color]) => (
            <View key={label as string} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color as string }]} />
              <Text style={styles.legendText}>{label as string}</Text>
            </View>
          ))}
        </View>
        <View style={styles.storageActions}>
          <Pressable style={styles.manageBtn}>
            <Ionicons name="options-outline" size={16} color="#fff" />
            <Text style={styles.manageText}>Manage</Text>
          </Pressable>
          <Pressable style={styles.requestBtn}>
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.requestGradient}
            >
              <Text style={styles.requestText}>Request Storage</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
      </SafeAreaView>

      <View style={styles.lowerSection}>
      <SectionHeader title="Quick Access" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
        {QUICK_ACCESS_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            style={styles.quickCard}
            onPress={() => onQuickAccess(item.id)}
          >
            <Image source={item.icon} style={styles.quickIcon} />
            <Text style={styles.quickLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader
        title="My Folders"
        actionLabel="View All"
        onAction={() => onViewAll("folders", "all")}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderRow}>
        {folders.length === 0 ? (
          <Text style={styles.emptyHint}>No folders yet</Text>
        ) : (
          folders.map((folder, i) => (
            <Pressable key={folder.path} style={styles.folderCard} onPress={() => onOpenFolder(folder)}>
              <Pressable
                style={styles.folderMenu}
                onPress={() => onFolderMenu?.(folder)}
                hitSlop={8}
              >
                <Image source={figmaAssets.home.folderMenu} style={styles.menuIcon} />
              </Pressable>
              <LinearGradient
                colors={
                  i % 2 === 0
                    ? [theme.colors.folderOrangeStart, theme.colors.folderOrangeEnd]
                    : ["#ffffff", "#f4f4f5"]
                }
                style={styles.folderIconWrap}
              >
                {i % 2 === 0 ? (
                  <Image source={figmaAssets.home.folderIcon} style={styles.folderIcon} />
                ) : (
                  <View style={styles.dotsGrid}>
                    <View style={[styles.colorDot, { backgroundColor: "#e64343" }]} />
                    <View style={[styles.colorDot, { backgroundColor: "#ce74e3" }]} />
                    <View style={[styles.colorDot, { backgroundColor: "#28bc5e" }]} />
                    <View style={[styles.colorDot, { backgroundColor: "#1d84f5" }]} />
                  </View>
                )}
              </LinearGradient>
              <Text style={styles.folderName}>{folder.name}</Text>
              <Text style={styles.folderMeta}>{folderMetaLabel(folder)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <SectionHeader
        title="Recent Files"
        actionLabel="View All"
        onAction={() => onViewAll("recent", "recent")}
      />
      <View style={styles.recentList}>
        {recent.length === 0 ? (
          <Text style={styles.emptyHint}>No files yet</Text>
        ) : (
          recent.map((file) => (
            <Pressable key={file.path} style={styles.recentCard} onPress={() => onOpenFile(file)}>
              {fileTypeIcon(file) ? (
                <Image source={fileTypeIcon(file)!} style={styles.fileTypeIcon} />
              ) : (
                <View style={[styles.fileThumbWrap, { backgroundColor: `${fileIconColor(file)}15` }]}>
                  <Ionicons name={fileIconName(file)} size={24} color={fileIconColor(file)} />
                </View>
              )}
              <View style={styles.fileMeta}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSub}>
                  {formatFileSize(file.size)} · {formatRelativeDate(file.lastModified)}
                </Text>
              </View>
              {sharedPaths.has(file.path) && (
                <View style={styles.sharedTag}>
                  <Text style={styles.sharedText}>Shared</Text>
                </View>
              )}
              <Pressable onPress={() => onFileMenu?.(file)} hitSlop={8}>
                <Image source={figmaAssets.home.fileMenu} style={styles.menuIcon} />
              </Pressable>
            </Pressable>
          ))
        )}
      </View>

      <SectionHeader
        title="Shared with you"
        actionLabel="View All"
        onAction={() => onViewAll("shared", "all")}
      />
      <View style={styles.sharedList}>
        {sharesQuery.isLoading ? (
          <Text style={styles.emptyHint}>Loading shares…</Text>
        ) : sharedWithMe.length === 0 ? (
          <Text style={styles.emptyHint}>No shared items yet</Text>
        ) : (
          sharedWithMe.map((share) => {
            const fileName = share.path?.split("/").pop() ?? "Shared file";
            const owner = share.displayname_owner || "Someone";
            return (
              <View key={share.id} style={styles.sharedCard}>
                <View style={styles.sharedAvatar}>
                  <Text style={styles.sharedAvatarText}>{owner.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.sharedMeta}>
                  <Text style={styles.sharedOwner}>{owner}</Text>
                  <Text style={styles.sharedMessage} numberOfLines={1}>
                    Shared "{fileName}"
                  </Text>
                </View>
                <Pressable style={styles.downloadBtn}>
                  <Image source={figmaAssets.home.download} style={styles.downloadIcon} />
                </Pressable>
              </View>
            );
          })
        )}
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surfaceMuted },
  content: { paddingBottom: 160 },
  topSafe: { backgroundColor: theme.colors.surface },
  lowerSection: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 22, height: 22 },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  storageCard: {
    marginHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.card,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  storageLabel: { fontSize: 18, color: theme.colors.textDark, marginBottom: 4, lineHeight: 18.5 },
  storageUsed: { fontSize: 18, marginBottom: 12 },
  storageBold: { fontWeight: "600", fontSize: 24, color: theme.colors.textDark, lineHeight: 18.5 },
  storageMuted: { fontWeight: "400", fontSize: 18, color: "#71717b", lineHeight: 18.5 },
  storageBar: { flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden", gap: 2 },
  barSeg: { borderRadius: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: theme.colors.textMuted },
  storageActions: { flexDirection: "row", gap: 10 },
  manageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#242424",
    borderRadius: theme.radius.md,
    paddingVertical: 12,
  },
  manageText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  requestBtn: { flex: 1.4, borderRadius: theme.radius.md, overflow: "hidden" },
  requestGradient: { paddingVertical: 12, alignItems: "center" },
  requestText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  quickRow: { paddingHorizontal: theme.spacing.screen, marginBottom: 24 },
  quickCard: {
    width: 103,
    height: 95,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 0.4,
    borderColor: "#dfe1e4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5.4 },
    shadowOpacity: 0.5,
    shadowRadius: 10.8,
    elevation: 3,
  },
  quickIcon: { width: 40, height: 40, resizeMode: "contain", marginBottom: 8 },
  quickLabel: { fontSize: 12, color: "#414157", fontWeight: "500" },
  menuIcon: { width: 15, height: 15, resizeMode: "contain" },
  fileTypeIcon: { width: 44, height: 44, resizeMode: "contain" },
  folderRow: { paddingHorizontal: theme.spacing.screen, marginBottom: 24 },
  folderCard: {
    width: 158,
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
    marginRight: 12,
    alignItems: "center",
    position: "relative",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 7.4 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 4,
  },
  folderMenu: { position: "absolute", top: 12, right: 12, zIndex: 1 },
  folderIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  folderIcon: { width: 42, height: 42 },
  dotsGrid: { flexDirection: "row", flexWrap: "wrap", width: 30, gap: 4 },
  colorDot: { width: 11, height: 11, borderRadius: 6 },
  folderName: { fontWeight: "600", fontSize: 13, color: "#09090b" },
  folderMeta: { fontSize: 10, color: "#71717b", marginTop: 2 },
  recentList: { paddingHorizontal: theme.spacing.screen, gap: 8, marginBottom: 24 },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 12,
    ...theme.shadow.card,
  },
  fileThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  fileSub: { fontSize: 12, color: theme.colors.textSubtle, marginTop: 2 },
  sharedTag: {
    backgroundColor: "#ddf0ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  sharedText: { fontSize: 10, color: "#2b7fff" },
  sharedList: { paddingHorizontal: theme.spacing.screen, gap: 10, marginBottom: 24 },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadow.card,
  },
  sharedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sharedAvatarText: { fontWeight: "600", color: theme.colors.accent },
  sharedMeta: { flex: 1 },
  sharedOwner: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  sharedMessage: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadIcon: { width: 18, height: 18 },
  emptyHint: { color: theme.colors.textMuted, paddingHorizontal: theme.spacing.screen },
});
