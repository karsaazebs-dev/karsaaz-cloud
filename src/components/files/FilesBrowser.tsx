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
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { figmaAssets } from "@/src/constants/assets";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { useAuthStore } from "@/src/stores/authStore";
import type { BrowseFilter } from "@/src/stores/uiStore";
import { filterFiles, sortFiles, formatFileDate, formatFileSize } from "@/src/utils/fileFilters";

const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_SIZE =
  (Dimensions.get("window").width - 24 * 2 - GRID_GAP * (GRID_COLS - 1)) /
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
            color={item.type === "directory" ? "#4e3cf4" : "#4e3cf4"}
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
          <Ionicons name="person-add-outline" size={20} color="#71717b" />
        </Pressable>
        <Pressable
          onPress={() => {
            setMenuFileId(item.path);
            onMenu(item);
          }}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#71717b" />
        </Pressable>
      </Pressable>
      {menuFileId === item.path && (
        <View style={styles.popupMenu}>
          <Pressable style={styles.popupItem} onPress={() => { setMenuFileId(null); onMenu(item); }}>
            <Ionicons name="create-outline" size={18} color="#09090b" />
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
            <Ionicons name="share-social-outline" size={18} color="#09090b" />
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
        color={item.type === "directory" ? "#4e3cf4" : "#4e3cf4"}
      />
      <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <View style={styles.searchRow}>
          {onBackToDashboard ? (
            <Pressable onPress={onBackToDashboard} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color="#09090b" />
            </Pressable>
          ) : null}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#71717b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search files..."
              placeholderTextColor="#71717b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable onPress={onAvatarPress}>
            <Image source={figmaAssets.home.avatar} style={styles.avatarImage} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.toolbar}>
        <Pressable style={styles.sortBtn} onPress={cycleSort}>
          <Text style={styles.sortLabel}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="#09090b" />
        </Pressable>
        <Pressable onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
          <Ionicons
            name={viewMode === "list" ? "grid-outline" : "list-outline"}
            size={20}
            color="#09090b"
          />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{title}</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4e3cf4" />
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

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f7f7" },
  safeTop: { backgroundColor: "#f7f7f7" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: "#09090b" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: { fontSize: 16, fontWeight: "500", color: "#09090b" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#09090b",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 24, paddingBottom: 120, gap: 8 },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  fileCardActive: { backgroundColor: "#f4f4f5" },
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
  fileSub: { fontSize: 13, color: "#71717b", marginTop: 2 },
  popupMenu: {
    position: "absolute",
    right: 24,
    top: 52,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 8,
    zIndex: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  popupItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  popupText: { fontSize: 15, color: "#09090b" },
  destructive: { color: "#dc2626" },
  gridCard: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: GRID_GAP,
    marginRight: GRID_GAP,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gridName: { fontSize: 12, color: "#09090b", marginTop: 8, textAlign: "center" },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: "#71717b", marginTop: 40 },
});