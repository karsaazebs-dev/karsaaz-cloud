/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { figmaAssets } from "@/src/constants/assets";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { ConnectionStatus } from "@/src/components/ui/ConnectionStatus";
import { useUiStore } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { useAuthStore } from "@/src/stores/authStore";
import type { BrowseFilter } from "@/src/stores/uiStore";
import { filterFiles, sortFiles, formatFileDate, formatFileSize } from "@/src/utils/fileFilters";
import { theme } from "@/src/constants/theme";

const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_SIZE =
  (Dimensions.get("window").width - theme.spacing.screen * 2 - GRID_GAP * (GRID_COLS - 1)) /
  GRID_COLS;

interface FilesBrowserProps {
  files: KarsaazFile[];
  isLoading: boolean;
  isRefetching: boolean;
  title?: string;
  filter?: BrowseFilter;
  onRefresh: () => void;
  onOpen: (file: KarsaazFile) => void;
  onShare: (file: KarsaazFile) => void;
  onMenu: (file: KarsaazFile) => void;
  onFabPress: () => void;
  onAvatarPress: () => void;
  onBackToDashboard?: () => void;
}

export function FilesBrowser({
  files,
  isLoading,
  isRefetching,
  title = "All files",
  filter: filterProp,
  onRefresh,
  onOpen,
  onShare,
  onMenu,
  onFabPress,
  onAvatarPress,
  onBackToDashboard,
}: FilesBrowserProps) {
  const displayName = useAuthStore((s) => s.displayName);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const storeFilter = useUiStore((s) => s.browseFilter);
  const browseFilter = filterProp ?? storeFilter;
  const sortOrder = useUiStore((s) => s.sortOrder);
  const setSortOrder = useUiStore((s) => s.setSortOrder);
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const favoritePaths = useFavoritesStore((s) => s.paths);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);

  const visibleFiles = useMemo(
    () => sortFiles(filterFiles(files, browseFilter, favoritePaths, searchQuery), sortOrder),
    [files, browseFilter, favoritePaths, searchQuery, sortOrder]
  );

  const cycleSort = () => {
    const order = ["name-asc", "name-desc", "date-desc", "size-desc"] as const;
    const idx = order.indexOf(sortOrder);
    setSortOrder(order[(idx + 1) % order.length]);
  };

  const sortLabel =
    sortOrder === "name-asc" || sortOrder === "name-desc" ? "A - Z" : "Sorted";

  const renderListItem = ({ item }: { item: KarsaazFile }) => (
    <View>
      <Pressable
        style={[styles.fileCard, menuFileId === item.path && styles.fileCardActive]}
        onPress={() => onOpen(item)}
      >
        <View style={styles.thumb}>
          <Ionicons
            name={item.type === "directory" ? "folder" : "image-outline"}
            size={28}
            color={item.type === "directory" ? "#ff7900" : theme.colors.accent}
          />
        </View>
        <View style={styles.fileMeta}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.fileSub}>
            {item.type === "directory" ? "Folder" : formatFileSize(item.size)}
            {item.type === "file" ? ` • ${formatFileDate(item.lastModified)}` : ""}
          </Text>
        </View>
        <Pressable onPress={() => onShare(item)} hitSlop={8}>
          <Ionicons name="person-add-outline" size={20} color={theme.colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={() => {
            setMenuFileId(item.path);
            onMenu(item);
          }}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textMuted} />
        </Pressable>
      </Pressable>
      {menuFileId === item.path && (
        <View style={styles.popupMenu}>
          <Pressable style={styles.popupItem} onPress={() => { setMenuFileId(null); onMenu(item); }}>
            <Ionicons name="create-outline" size={18} color={theme.colors.text} />
            <Text style={styles.popupText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.popupItem}
            onPress={() => { setMenuFileId(null); onMenu(item); }}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
            <Text style={[styles.popupText, styles.destructive]}>Delete</Text>
          </Pressable>
          <Pressable style={styles.popupItem} onPress={() => { setMenuFileId(null); onShare(item); }}>
            <Ionicons name="share-social-outline" size={18} color={theme.colors.text} />
            <Text style={styles.popupText}>Share</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderGridItem = ({ item }: { item: KarsaazFile }) => (
    <Pressable style={styles.gridCard} onPress={() => onOpen(item)}>
      <Ionicons
        name={item.type === "directory" ? "folder" : "document-outline"}
        size={32}
        color={item.type === "directory" ? "#ff7900" : theme.colors.accent}
      />
      <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {onBackToDashboard ? (
            <Pressable onPress={onBackToDashboard} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>
          ) : null}
          <ConnectionStatus />
        </View>
        <View style={styles.topActions}>
          <Image source={figmaAssets.home.bell} style={styles.bellIcon} />
          <Pressable onPress={onAvatarPress} style={styles.avatar}>
            <Image source={figmaAssets.home.avatar} style={styles.avatarImage} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#7b7985" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search files..."
          placeholderTextColor="#7b7985"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.sortBtn} onPress={cycleSort}>
          <Text style={styles.sortLabel}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.text} />
        </Pressable>
        <Pressable onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
          <Ionicons
            name={viewMode === "list" ? "grid-outline" : "list-outline"}
            size={20}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{title}</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
      ) : (
        <FlatList
          data={visibleFiles}
          key={viewMode}
          numColumns={viewMode === "grid" ? GRID_COLS : 1}
          keyExtractor={(item) => item.path}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
          renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
          ListEmptyComponent={<Text style={styles.empty}>No files found</Text>}
        />
      )}

      <Pressable style={styles.fab} onPress={onFabPress}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 52,
    paddingBottom: 12,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  bellIcon: { width: 22, height: 22 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(43,127,255,0.2)",
  },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 0.4,
    borderColor: "#dfe1e4",
    ...theme.shadow.card,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.text },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: 12,
  },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: { fontSize: 16, fontWeight: "500", color: theme.colors.text },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.screen,
    marginBottom: 8,
  },
  list: { paddingHorizontal: theme.spacing.screen, paddingBottom: 120, gap: 8 },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 0.4,
    borderColor: "#dfe1e4",
    padding: 12,
    marginBottom: 8,
    ...theme.shadow.card,
  },
  fileCardActive: { backgroundColor: theme.colors.infoBg },
  thumb: {
    width: 56,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: "500", color: "#5c5c5c" },
  fileSub: { fontSize: 12, color: theme.colors.textSubtle, marginTop: 2 },
  popupMenu: {
    position: "absolute",
    right: 24,
    top: 52,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 10,
    ...theme.shadow.card,
  },
  popupItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  popupText: { fontSize: 14, color: theme.colors.text },
  destructive: { color: "#dc2626" },
  gridCard: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: GRID_GAP,
    marginRight: GRID_GAP,
    ...theme.shadow.card,
  },
  gridName: { fontSize: 11, color: theme.colors.text, marginTop: 6, textAlign: "center" },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: theme.colors.textMuted, marginTop: 40 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accentBright,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.button,
  },
  fabIcon: { width: 28, height: 28 },
});
