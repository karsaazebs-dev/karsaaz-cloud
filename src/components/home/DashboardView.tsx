/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:640 — Dashboard
 */

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConnectionStatus } from "@/src/components/ui/ConnectionStatus";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";
import { useSharing } from "@/src/hooks/useSharing";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useAuthStore } from "@/src/stores/authStore";
import type { BrowseFilter } from "@/src/stores/uiStore";
import { sharePathToDavPath } from "@/src/utils/cacheFileMapping";
import { formatFileSize, formatRelativeDate } from "@/src/utils/fileFilters";
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";
import { Ionicons } from "@expo/vector-icons";
import type { KarsaazFile } from "@karsaaz/cloud-api";

export type QuickAccessId = "docs" | "pdf" | "favorites" | "shared" | "videos" | "more";

const QUICK_ACCESS_ITEMS: { id: QuickAccessId; label: string; icon: number }[] = [
  { id: "docs", label: "Docs", icon: figmaAssets.home.docsQuick },
  { id: "pdf", label: "PDF", icon: figmaAssets.home.pdfQuick },
  { id: "favorites", label: "Favourites", icon: figmaAssets.home.favQuick },
  { id: "shared", label: "Shared", icon: figmaAssets.home.sharedQuick },
  { id: "videos", label: "Videos", icon: figmaAssets.home.videosQuick },
  { id: "more", label: "More", icon: figmaAssets.home.menuTab },
];

const LEGEND: [string, string][] = [
  ["Images", theme.colors.storageImages],
  ["Documents", theme.colors.storageDocs],
  ["Videos", theme.colors.storageVideos],
  ["Others", theme.colors.storageOther],
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
  onLegendPress?: (category: string) => void;
}

function fileIconColor(file: KarsaazFile): string {
  if (file.type === "directory") return "#ff7900";
  if (file.fileType === "image") return theme.colors.storageImages;
  if (file.mimeType?.includes("video")) return theme.colors.storageVideos;
  if (file.mimeType?.includes("pdf")) return "#e64343";
  return theme.colors.accent;
}

function fileIconName(file: KarsaazFile): keyof typeof Ionicons.glyphMap {
  if (file.type === "directory") return "folder";
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
  onLegendPress,
}: DashboardViewProps) {
  const username = useAuthStore((s) => s.username);
  const { sharesQuery } = useSharing();
  const { data: userQuota } = useUserQuota();

  const folders = files.filter((f) => f.type === "directory").slice(0, 6);
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

  const imgW = Math.max(usedPct * 0.40, 0.05);
  const docW = Math.max(usedPct * 0.30, 0.05);
  const vidW = Math.max(usedPct * 0.20, 0.05);
  const othW = Math.max(usedPct * 0.10, 0.05);
  const emptyW = Math.max(100 - usedPct, 0.05);

  const usedLabel = isUnlimited
    ? formatFileSize(usedBytes)
    : totalGb >= 1
      ? `${Math.round(usedGb)} GB`
      : formatFileSize(usedBytes);
  const totalLabel = isUnlimited
    ? "of Unlimited used"
    : totalGb >= 1
      ? `of ${Math.round(totalGb)} GB used`
      : `of ${formatFileSize(totalBytes)} used`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Top white section ── */}
      <SafeAreaView edges={["top"]} style={styles.topSection}>
        <View style={styles.header}>
          <ConnectionStatus />
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}>
              <Image source={figmaAssets.home.bell} style={styles.headerIcon} />
            </Pressable>
            <Pressable style={styles.avatarBtn} onPress={onAvatarPress}>
              <Image source={figmaAssets.home.avatar} style={styles.avatar} />
            </Pressable>
          </View>
        </View>

        {/* ── Storage widget ── */}
        <View style={styles.storageSection}>
          <Text style={styles.storageTitle}>Alloted Storage</Text>
          <View style={styles.storageAmountRow}>
            <Text style={styles.storageBold}>{usedLabel} </Text>
            <Text style={styles.storageMuted}>{totalLabel}</Text>
          </View>
          <View style={styles.storageBarContainer}>
            <View style={styles.storageBar}>
              <View style={[styles.barSeg, { flex: imgW, backgroundColor: theme.colors.storageImages, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
              <View style={[styles.barSeg, { flex: docW, backgroundColor: theme.colors.storageDocs }]} />
              <View style={[styles.barSeg, { flex: vidW, backgroundColor: theme.colors.storageVideos }]} />
              <View style={[styles.barSeg, { flex: othW, backgroundColor: theme.colors.storageOther }]} />
              {emptyW > 0 && (
                <View style={[styles.barSeg, { flex: emptyW, backgroundColor: theme.colors.storageEmpty, borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
              )}
            </View>
          </View>
          <View style={styles.legend}>
            {LEGEND.map(([label, color]) => (
              <Pressable key={label} style={styles.legendItem} onPress={() => onLegendPress?.(label)}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.storageActions}>
            <Pressable style={styles.manageBtn} onPress={onManageStorage}>
              <Image source={figmaAssets.home.manageIcon} style={styles.manageBtnIcon} />
              <Text style={styles.manageBtnText}>Manage</Text>
            </Pressable>
            <Pressable style={styles.requestBtn} onPress={onRequestStorage}>
              <Text style={styles.requestBtnText}>Request Storage</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Gray lower section ── */}
      <View style={styles.lowerSection}>
        <SectionHeader title="Quick Access" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
          {QUICK_ACCESS_ITEMS.map((item) => (
            <Pressable key={item.id} style={styles.quickCard} onPress={() => onQuickAccess(item.id)}>
              <View style={styles.quickIconWrap}>
                <Image
                  source={item.icon}
                  style={[
                    styles.quickIcon,
                    item.id === "more" && { tintColor: theme.colors.accent },
                  ]}
                  onLoad={() => {
                    if (item.id !== "docs") return;
                    // #region agent log
                    phase1DebugLog("DashboardView.tsx:quickIcon", "quick access icon loaded", { itemId: item.id }, "C");
                    // #endregion
                  }}
                  onError={() => {
                    if (item.id !== "docs") return;
                    // #region agent log
                    phase1DebugLog("DashboardView.tsx:quickIcon", "quick access icon failed", { itemId: item.id }, "C");
                    // #endregion
                  }}
                />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title="My Folders"
          actionLabel="View All"
          onAction={() => onViewAll("folders", "all")}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderScroll}>
          {folders.length === 0 ? (
            <Text style={styles.emptyHint}>No folders yet</Text>
          ) : (
            folders.map((folder) => (
              <Pressable key={folder.path} style={styles.folderCard} onPress={() => onOpenFolder(folder)}>
                <View style={styles.folderCardInner}>
                  <View style={styles.folderIconContainer}>
                    <Image source={figmaAssets.home.folderIcon} style={styles.folderIcon} />
                  </View>
                  <View style={styles.folderInfo}>
                    <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
                    <Text style={styles.folderMeta}>
                      {folder.size > 0 ? formatFileSize(folder.size) : "Empty folder"}
                    </Text>
                  </View>
                  <Pressable style={styles.folderMenu} onPress={() => onFolderMenu?.(folder)} hitSlop={8}>
                    <Ionicons name="ellipsis-vertical" size={16} color="#b0b0b0" />
                  </Pressable>
                </View>
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
                  <View style={styles.fileIconContainer}>
                    <Image source={fileTypeIcon(file)!} style={styles.fileTypeIcon} />
                  </View>
                ) : (
                  <View style={[styles.fileThumb, { backgroundColor: `${fileIconColor(file)}14` }]}>
                    <Ionicons name={fileIconName(file)} size={22} color={fileIconColor(file)} />
                  </View>
                )}
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileSub}>{formatFileSize(file.size)} · {formatRelativeDate(file.lastModified)}</Text>
                </View>
                {sharedPaths.has(file.path) && (
                  <View style={styles.sharedBadge}>
                    <Text style={styles.sharedBadgeText}>Shared</Text>
                  </View>
                )}
                <Pressable onPress={() => onFileMenu?.(file)} hitSlop={8} style={styles.fileMenuBtn}>
                  <Ionicons name="ellipsis-vertical" size={16} color="#b0b0b0" />
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
                    <Text style={styles.sharedMsg} numberOfLines={1}>Shared "{fileName}"</Text>
                  </View>
                  <Pressable style={styles.downloadBtn}>
                    <Ionicons name="cloud-download-outline" size={20} color={theme.colors.accentBright} />
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
  screen: { flex: 1, backgroundColor: "#f4f5f7" },
  content: { paddingBottom: 120 },

  // top white block
  topSection: { backgroundColor: "#ffffff", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: { width: 22, height: 22, resizeMode: "contain" },
  avatarBtn: {},
  avatar: { width: 34, height: 34, borderRadius: 17 },

  // storage widget
  storageSection: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 2 },
  storageTitle: { fontSize: 13, color: "#9ca3af", marginBottom: 4, fontWeight: "500" },
  storageAmountRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  storageBold: { fontSize: 26, fontWeight: "700", color: "#1a1a2e" },
  storageMuted: { fontSize: 14, color: "#9ca3af", fontWeight: "400" },
  storageBarContainer: { marginBottom: 10 },
  storageBar: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: "#eef0f4" },
  barSeg: {},
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 10, color: "#9ca3af", fontWeight: "500" },
  storageActions: { flexDirection: "row", gap: 10 },
  manageBtn: {
    flex: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1d1f2b",
  },
  manageBtnText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },
  manageBtnIcon: { width: 16, height: 16, resizeMode: "contain", tintColor: "#ffffff" },
  requestBtn: {
    flex: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    backgroundColor: "#5a3cf4",
  },
  requestBtnText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },

  // lower gray section
  lowerSection: { paddingTop: 16, paddingBottom: 24 },

  // quick access horizontal
  quickScroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  quickCard: { alignItems: "center", gap: 6, width: 80 },
  quickIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: { width: 42, height: 42, resizeMode: "contain" },
  quickLabel: { fontSize: 11, color: "#6b7280", fontWeight: "500", textAlign: "center" },

  // folders
  folderScroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  folderCard: {
    width: 152,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  folderCardInner: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  folderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  folderMenu: { position: "absolute", top: 0, right: 0, zIndex: 1, padding: 2 },
  folderIcon: { width: 26, height: 26, tintColor: "#f59e0b" },
  folderInfo: {},
  folderName: { fontWeight: "600", fontSize: 13, color: "#1a1a2e", marginBottom: 2 },
  folderMeta: { fontSize: 11, color: "#9ca3af" },

  // recent files
  recentList: { paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fileIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileTypeIcon: { width: 42, height: 42, resizeMode: "contain" },
  fileThumb: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },
  fileSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  sharedBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sharedBadgeText: { fontSize: 10, color: "#10b981", fontWeight: "600" },
  fileMenuBtn: { padding: 4 },

  // shared with you
  sharedList: { paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sharedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  sharedAvatarText: { fontWeight: "700", color: "#7c3aed", fontSize: 15 },
  sharedMeta: { flex: 1 },
  sharedOwner: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },
  sharedMsg: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  downloadBtn: { padding: 6 },

  emptyHint: { color: "#9ca3af", paddingHorizontal: 20, paddingBottom: 12, fontSize: 13 },
});
