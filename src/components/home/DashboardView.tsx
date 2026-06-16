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
  onManageStorage?: () => void;
  onRequestStorage?: () => void;
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
  onManageStorage,
  onRequestStorage,
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
    (sharesQuery.data ?? []).map((s: any) => sharePathToDavPath(s.path, username))
  );
  const usedBytes = userQuota?.quota?.used ?? files.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const isUnlimited = totalBytes < 0;
  const usedGb = Math.max(usedBytes / (1024 * 1024 * 1024), 0.1);
  const totalGb = isUnlimited ? 0 : totalBytes / (1024 * 1024 * 1024);

  const usedPct = isUnlimited ? 0 : Math.min(Math.max((usedBytes / totalBytes) * 100, 0), 100);
  const imgWeight = Math.max(usedPct * 0.40, 0.05);
  const docWeight = Math.max(usedPct * 0.30, 0.05);
  const vidWeight = Math.max(usedPct * 0.20, 0.05);
  const othWeight = Math.max(usedPct * 0.10, 0.05);
  const emptyWeight = Math.max(100 - usedPct, 0.05);

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
        <View style={styles.headerLeft}>
          <Image source={figmaAssets.splashLogo} style={styles.logo} />
          <Text style={styles.logoText}>Storage.io</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#4e3cf4" />
          </Pressable>
          <Pressable style={styles.bellWrap}>
            <Image source={figmaAssets.home.bell} style={styles.headerIcon} />
          </Pressable>
        </View>
      </View>

      <View style={styles.storageCard}>
        <View style={styles.storageRow}>
          <Text style={styles.storageLabel}>Storage</Text>
          <Pressable onPress={onManageStorage}>
            <Ionicons name="settings-outline" size={20} color="#4e3cf4" />
          </Pressable>
        </View>
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
          <View style={[styles.barSeg, { flex: imgWeight, backgroundColor: theme.colors.storageImages }]} />
          <View style={[styles.barSeg, { flex: docWeight, backgroundColor: theme.colors.storageDocs }]} />
          <View style={[styles.barSeg, { flex: vidWeight, backgroundColor: theme.colors.storageVideos }]} />
          <View style={[styles.barSeg, { flex: othWeight, backgroundColor: theme.colors.storageOther }]} />
          {emptyWeight > 0 && (
            <View style={[styles.barSeg, { flex: emptyWeight, backgroundColor: theme.colors.storageEmpty }]} />
          )}
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
      </View>
      </SafeAreaView>

      <View style={styles.lowerSection}>
      <SectionHeader title="Quick Access" />
      <View style={styles.quickGrid}>
        {QUICK_ACCESS_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            style={styles.quickCard}
            onPress={() => onQuickAccess(item.id)}
          >
            <View style={styles.quickIconWrap}>
              <Image source={item.icon} style={styles.quickIcon} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader
        title="My Folders"
        actionLabel="View All"
        onAction={() => onViewAll("folders", "all")}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderRow}>
        {folders.length === 0 ? (
          <Text style={styles.emptyHint}>No folders yet</Text>
        ) : (
          folders.map((folder) => (
            <Pressable key={folder.path} style={styles.folderCard} onPress={() => onOpenFolder(folder)}>
              <Pressable
                style={styles.folderMenu}
                onPress={() => onFolderMenu?.(folder)}
                hitSlop={8}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#71717b" />
              </Pressable>
              <Image source={figmaAssets.home.folderIcon} style={styles.folderIcon} />
              <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
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
                <Ionicons name="ellipsis-vertical" size={16} color="#71717b" />
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
          sharedWithMe.map((share: any) => {
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
  screen: { flex: 1, backgroundColor: "#fafafa" },
  content: { paddingBottom: 160 },
  topSafe: { backgroundColor: "#ffffff" },
  lowerSection: {
    backgroundColor: "#fafafa",
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { width: 32, height: 32 },
  logoText: {
    fontSize: 18,
    color: "#09090b",
    fontWeight: "500",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: { width: 22, height: 22 },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  storageCard: {
    marginHorizontal: 24,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  storageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storageLabel: { fontSize: 16, color: "#09090b", fontWeight: "500" },
  storageUsed: { fontSize: 16, marginBottom: 12 },
  storageBold: { fontWeight: "600", fontSize: 24, color: "#09090b" },
  storageMuted: { fontWeight: "400", fontSize: 18, color: "#71717b" },
  storageBar: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 },
  barSeg: { borderRadius: 3 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#71717b" },
  quickGrid: {
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: "30%",
    alignItems: "center",
    gap: 8,
  },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIcon: { width: 28, height: 28, resizeMode: "contain" },
  quickLabel: { fontSize: 12, color: "#71717b", fontWeight: "500" },
  menuIcon: { width: 15, height: 15, resizeMode: "contain" },
  fileTypeIcon: { width: 44, height: 44, resizeMode: "contain" },
  folderRow: { paddingHorizontal: 24, marginBottom: 24 },
  folderCard: {
    width: 140,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: "flex-start",
    position: "relative",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  folderMenu: { position: "absolute", top: 12, right: 12, zIndex: 1 },
  folderIcon: { width: 56, height: 56, marginBottom: 12 },
  folderName: { fontWeight: "600", fontSize: 14, color: "#09090b" },
  folderMeta: { fontSize: 12, color: "#71717b", marginTop: 4 },
  recentList: { paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  fileThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: "600", color: "#09090b" },
  fileSub: { fontSize: 12, color: "#71717b", marginTop: 4 },
  sharedTag: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sharedText: { fontSize: 12, color: "#4e3cf4", fontWeight: "500" },
  sharedList: { paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sharedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  sharedAvatarText: { fontWeight: "600", color: "#4e3cf4", fontSize: 16 },
  sharedMeta: { flex: 1 },
  sharedOwner: { fontSize: 14, fontWeight: "600", color: "#09090b" },
  sharedMessage: { fontSize: 12, color: "#71717b", marginTop: 4 },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  downloadIcon: { width: 20, height: 20 },
  emptyHint: { color: "#71717b", paddingHorizontal: 24 },
});