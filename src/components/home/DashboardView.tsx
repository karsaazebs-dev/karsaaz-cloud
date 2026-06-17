/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:640 — Dashboard
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
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";

export type QuickAccessId = "docs" | "pdf" | "favorites" | "shared" | "videos" | "more";

const QUICK_ACCESS_ITEMS: { id: QuickAccessId; label: string; icon: number }[] = [
  { id: "docs",      label: "Docs",       icon: figmaAssets.home.docsQuick },
  { id: "pdf",       label: "PDF",        icon: figmaAssets.home.pdfQuick },
  { id: "favorites", label: "Favourites", icon: figmaAssets.home.favQuick },
  { id: "shared",    label: "Shared",     icon: figmaAssets.home.sharedQuick },
  { id: "videos",    label: "Videos",     icon: figmaAssets.home.videosQuick },
  { id: "more",      label: "More",       icon: figmaAssets.home.menuTab },
];

const LEGEND: [string, string][] = [
  ["Images",    theme.colors.storageImages],
  ["Documents", theme.colors.storageDocs],
  ["Videos",    theme.colors.storageVideos],
  ["Others",    theme.colors.storageOther],
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
          <Text style={styles.storageTitle}>Allocated Storage</Text>
          <Text style={styles.storageAmountRow}>
            <Text style={styles.storageBold}>{usedLabel} </Text>
            <Text style={styles.storageMuted}>{totalLabel}</Text>
          </Text>
          <View style={styles.storageBar}>
            <View style={[styles.barSeg, { flex: imgW, backgroundColor: theme.colors.storageImages }]} />
            <View style={[styles.barSeg, { flex: docW, backgroundColor: theme.colors.storageDocs }]} />
            <View style={[styles.barSeg, { flex: vidW, backgroundColor: theme.colors.storageVideos }]} />
            <View style={[styles.barSeg, { flex: othW, backgroundColor: theme.colors.storageOther }]} />
            {emptyW > 0 && (
              <View style={[styles.barSeg, { flex: emptyW, backgroundColor: theme.colors.storageEmpty }]} />
            )}
          </View>
          <View style={styles.legend}>
            {LEGEND.map(([label, color]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.storageActions}>
            <Pressable style={styles.manageBtn} onPress={onManageStorage}>
              <Ionicons name="settings-outline" size={15} color="#ffffff" />
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
                  style={styles.quickIcon}
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
                <Pressable style={styles.folderMenu} onPress={() => onFolderMenu?.(folder)} hitSlop={8}>
                  <Ionicons name="ellipsis-vertical" size={16} color="#71717b" />
                </Pressable>
                <Image source={figmaAssets.home.folderIcon} style={styles.folderIcon} />
                <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
                <Text style={styles.folderMeta}>
                  {folder.size > 0 ? formatFileSize(folder.size) : "Empty folder"}
                </Text>
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
                  <View style={[styles.fileThumb, { backgroundColor: `${fileIconColor(file)}18` }]}>
                    <Ionicons name={fileIconName(file)} size={24} color={fileIconColor(file)} />
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
                    <Text style={styles.sharedMsg} numberOfLines={1}>Shared "{fileName}"</Text>
                  </View>
                  <Pressable style={styles.downloadBtn}>
                    <Ionicons name="cloud-download-outline" size={22} color={theme.colors.accentBright} />
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
  screen: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { paddingBottom: 120 },

  // top white block
  topSection: { backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: { width: 22, height: 22, resizeMode: "contain" },
  avatarBtn: {},
  avatar: { width: 36, height: 36, borderRadius: 18 },

  // storage widget
  storageSection: { paddingHorizontal: 24, paddingBottom: 24 },
  storageTitle: { fontSize: 15, color: "#71717b", marginBottom: 6 },
  storageAmountRow: { marginBottom: 14 },
  storageBold: { fontSize: 32, fontWeight: "700", color: "#09090b" },
  storageMuted: { fontSize: 18, color: "#71717b" },
  storageBar: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  barSeg: {},
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#71717b" },
  storageActions: { flexDirection: "row", gap: 12 },
  manageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1d1f2b",
  },
  manageBtnText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  requestBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    backgroundColor: "#4e3cf4",
  },
  requestBtnText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },

  // lower gray section
  lowerSection: { paddingTop: 8, paddingBottom: 24 },

  // quick access horizontal
  quickScroll: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  quickCard: { alignItems: "center", gap: 8, width: 72 },
  quickIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  quickIcon: { width: 32, height: 32, resizeMode: "contain" },
  quickLabel: { fontSize: 12, color: "#71717b", fontWeight: "500", textAlign: "center" },

  // folders
  folderScroll: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  folderCard: {
    width: 148,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    position: "relative",
    ...theme.shadow.card,
  },
  folderMenu: { position: "absolute", top: 12, right: 12, zIndex: 1 },
  folderIcon: { width: 52, height: 52, marginBottom: 10 },
  folderName: { fontWeight: "600", fontSize: 14, color: "#09090b" },
  folderMeta: { fontSize: 12, color: "#71717b", marginTop: 4 },

  // recent files
  recentList: { paddingHorizontal: 24, gap: 10, marginBottom: 8 },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    ...theme.shadow.card,
  },
  fileTypeIcon: { width: 44, height: 44, resizeMode: "contain" },
  fileThumb: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: "600", color: "#09090b" },
  fileSub: { fontSize: 12, color: "#71717b", marginTop: 3 },
  sharedBadge: {
    backgroundColor: "#ddf0ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sharedBadgeText: { fontSize: 11, color: "#2b7fff", fontWeight: "500" },

  // shared with you
  sharedList: { paddingHorizontal: 24, gap: 10, marginBottom: 8 },
  sharedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    ...theme.shadow.card,
  },
  sharedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e8e5fd",
    alignItems: "center",
    justifyContent: "center",
  },
  sharedAvatarText: { fontWeight: "700", color: "#4e3cf4", fontSize: 16 },
  sharedMeta: { flex: 1 },
  sharedOwner: { fontSize: 14, fontWeight: "600", color: "#09090b" },
  sharedMsg: { fontSize: 12, color: "#71717b", marginTop: 3 },
  downloadBtn: { padding: 6 },

  emptyHint: { color: "#71717b", paddingHorizontal: 24, paddingBottom: 12 },
});
